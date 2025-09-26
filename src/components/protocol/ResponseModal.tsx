import React, { useState } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Send, Paperclip, Eye, EyeOff, Building, User, ChevronDown, Upload, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import RichTextEditor, { RichTextEditorRef } from '../common/RichTextEditor';
import DigitalSignatureModal from '../common/DigitalSignatureModal';
import SignatureRequestSection from '../common/SignatureRequestSection';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocolId: string;
  onMessageSent: () => void;
}

interface ResponseFormData {
  content: string;
  is_internal: boolean;
  attachments?: File[];
}

const ResponseModal: React.FC<ResponseModalProps> = ({
  isOpen,
  onClose,
  protocolId,
  onMessageSent
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['all']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [protocolInfo, setProtocolInfo] = useState<any>(null);
  const [protocolParticipants, setProtocolParticipants] = useState<any>({
    departments: [],
    users: [],
    hasClient: false
  });
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatureType, setSignatureType] = useState('');
  const [signatureTarget, setSignatureTarget] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const editorRef = React.useRef<RichTextEditorRef>(null);
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ResponseFormData>({
    defaultValues: {
      is_internal: false
    }
  });

  const isInternal = watch('is_internal');

  // Filter PDF attachments
  const pdfAttachments = attachments.filter(file => 
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );

  useEffect(() => {
    if (isOpen) {
      loadProtocolInfo();
      loadProtocolParticipants();
      setSelectedRecipients(['all']);
    }
  }, [isOpen]);

  const loadProtocolInfo = async () => {
    try {
      const data = await apiService.getProtocol(protocolId);
      setProtocolInfo(data.protocol);
    } catch (error) {
      console.error('Error loading protocol info:', error);
    }
  };
  const loadProtocolParticipants = async () => {
    try {
      // Get protocol details to see involved departments and users
      const protocolData = await apiService.getProtocol(protocolId);
      
      // Get all departments involved (current department + departments from audit trail)
      const involvedDepartments = new Set();
      const involvedUsers = new Set();
      
      // Add current department
      if (protocolData.protocol.department_name) {
        involvedDepartments.add(protocolData.protocol.department_name);
      }
      
      // Add assigned user
      if (protocolData.protocol.assigned_user_name) {
        involvedUsers.add(protocolData.protocol.assigned_user_name);
      }
      
      // Get audit trail to find other involved departments/users
      const auditTrail = await apiService.getProtocolAuditTrail(protocolId);
      auditTrail.forEach(entry => {
        if (entry.users?.nome) {
          involvedUsers.add(entry.users.nome);
        }
      });
      
      // Check if client is involved (has external messages)
      const hasClientMessages = protocolData.messages.some(msg => 
        msg.sender_type === 'client' || !msg.is_internal
      );
      
      setProtocolParticipants({
        departments: Array.from(involvedDepartments),
        users: Array.from(involvedUsers),
        hasClient: hasClientMessages || protocolData.protocol.requester_email
      });
    } catch (error) {
      console.error('Error loading protocol participants:', error);
    }
  };

  const handleRecipientToggle = (value: string) => {
    if (value === 'all') {
      // Se selecionar "Todos", limpa outras seleções
      setSelectedRecipients(['all']);
    } else {
      // Se selecionar qualquer outra opção, remove "Todos" e adiciona/remove a opção
      setSelectedRecipients(prev => {
        const withoutAll = prev.filter(r => r !== 'all');
        if (withoutAll.includes(value)) {
          const newSelection = withoutAll.filter(r => r !== value);
          // Se não sobrar nada, volta para "Todos"
          return newSelection.length === 0 ? ['all'] : newSelection;
        } else {
          return [...withoutAll, value];
        }
      });
    }
  };

  const getRecipientLabel = (value: string) => {
    if (value === 'all') return 'Todos os envolvidos no protocolo';
    if (value === 'client') return 'Cliente (resposta externa)';
    if (value.startsWith('department-')) return `Setor: ${value.replace('department-', '')}`;
    if (value.startsWith('user-')) return value.replace('user-', '');
    return value;
  };

  const getSelectedText = () => {
    if (selectedRecipients.includes('all')) {
      return 'Todos os envolvidos no protocolo';
    }
    if (selectedRecipients.length === 0) {
      return 'Selecione os destinatários';
    }
    if (selectedRecipients.length === 1) {
      return getRecipientLabel(selectedRecipients[0]);
    }
    return `${selectedRecipients.length} destinatários selecionados`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = async (data: ResponseFormData) => {
    // If signature is enabled, show signature confirmation modal
    if (signatureEnabled && signatureType && signatureTarget) {
      setShowSignatureModal(true);
      return;
    }

    await processResponse(data);
  };

  const processResponse = async (data: ResponseFormData) => {
    try {
      setLoading(true);
      
      // Get rich text content from editor
      const content = editorRef.current?.getContent() || '';
      const mentions = editorRef.current?.getMentions() || [];
      
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      // Upload attachments first
      const uploadedAttachments = [];
      for (const file of attachments) {
        try {
          // Upload file to Supabase Storage with proper bucket name
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${protocolId}/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('protocol-attachments')
            .upload(filePath, file);

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('protocol-attachments')
            .getPublicUrl(filePath);
          
          // Add attachment to database
          await apiService.addAttachment(protocolId, {
            filePath: filePath,
            original_name: file.name,
            size: file.size,
            type: file.type,
            uploaded_by: user.id
          });
          
          uploadedAttachments.push({
            id: Date.now() + Math.random(), // temporary ID
            name: file.name,
            original_name: file.name,
            size: file.size,
            type: file.type,
            url: publicUrl,
            file_path: filePath
          });
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Erro ao enviar arquivo ${file.name}`);
        }
      }
      
      // Determine if message should be internal based on recipients
      const isInternalMessage = data.is_internal;
      
      await apiService.sendMessage({
        protocol_id: protocolId,
        content,
        type: 'message',
        is_internal: isInternalMessage ? 1 : 0,
        attachments: uploadedAttachments,
        mentions
      }, user.id);
      
      const recipientText = selectedRecipients.includes('all') ? 'todos os envolvidos' : 
                           selectedRecipients.length > 1 ? `${selectedRecipients.length} destinatários` : 
                           selectedRecipients[0] === 'client' ? 'o cliente' : '1 destinatário';
      
      toast.success(`Resposta enviada para ${recipientText}!`);
      reset();
      setSelectedRecipients(['all']);
      setAttachments([]);
      onMessageSent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar resposta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedRecipients(['all']);
    setAttachments([]);
    setIsDropdownOpen(false);
    setIsDragOver(false);
    setSignatureEnabled(false);
    setSignatureType('');
    setSignatureTarget('');
    setShowSignatureModal(false);
    editorRef.current?.clear();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#404040] mb-3">Responder Protocolo</h2>
              {protocolInfo && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="font-medium text-gray-700">
                      Protocolo: <span className="text-[#FF6B35] font-mono">#{protocolInfo.number}</span>
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="font-medium text-gray-700">
                      Cliente: <span className="text-gray-900">{protocolInfo.requester_name}</span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Assunto:</span> {protocolInfo.subject}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold p-2 flex-shrink-0 ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Message content */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#404040] mb-3">Mensagem</h3>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Conteúdo da Resposta *
              </label>
              <RichTextEditor
                ref={editorRef}
                placeholder="Digite sua resposta..."
                protocolId={protocolId}
                height={200}
              />
            </div>

            {/* Attachments */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#404040] mb-3">Anexos</h3>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Arquivos Anexos (Opcional)
              </label>
              
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragOver
                    ? 'border-[#FF6B35] bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Arraste arquivos aqui ou{' '}
                  <label className="text-[#FF6B35] hover:text-orange-600 cursor-pointer font-medium">
                    clique para selecionar
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG, TXT (máx. 10MB cada)
                </p>
              </div>

              {/* File List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-[#404040]">
                    Arquivos Selecionados ({attachments.length})
                  </h4>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Configurações da Resposta */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#404040] mb-4">Configurações da Resposta</h3>
              
              {/* Digital Signature Section */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="enable_signature"
                    checked={signatureEnabled}
                    onChange={(e) => setSignatureEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                  />
                  <label htmlFor="enable_signature" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <span>🔐</span>
                    <span>Assinar digitalmente</span>
                  </label>
                </div>

                {signatureEnabled && (
                  <SignatureRequestSection
                    protocolInfo={protocolInfo}
                    attachments={attachments}
                    onSignatureConfigChange={(config) => {
                      setSignatureType(config.signatureType);
                      setSignatureTarget(config.signatureTarget);
                    }}
                  />
                )}
              </div>

              {/* Internal message toggle */}
              <div className="mb-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('is_internal')}
                    id="is_internal"
                    className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                  />
                  <label htmlFor="is_internal" className="flex items-center space-x-2 text-sm text-gray-700">
                    {isInternal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>Mensagem interna (não visível para o cliente)</span>
                  </label>
                </div>

                {isInternal && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Esta mensagem será visível apenas para os agentes internos
                    </p>
                  </div>
                )}
              </div>

              {/* Recipients Selection */}
              <div>
                <h4 className="text-sm font-medium text-[#404040] mb-3">
                Destinatários da Resposta
                </h4>
              
                <div className="relative">
                  {/* Multiselect Button */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <span className="text-sm text-gray-900 truncate">
                      {getSelectedText()}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Options */}
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* All participants option */}
                      <label className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRecipients.includes('all')}
                          onChange={() => handleRecipientToggle('all')}
                          className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          Todos os envolvidos no protocolo
                        </span>
                      </label>

                      {/* Separator */}
                      <div className="border-t border-gray-200"></div>

                      {/* Client option */}
                      {protocolParticipants.hasClient && (
                        <label className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.includes('client')}
                            onChange={() => handleRecipientToggle('client')}
                            className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                          />
                          <span className="text-sm text-gray-700">
                            Cliente (resposta externa)
                          </span>
                        </label>
                      )}

                      {/* Departments */}
                      {protocolParticipants.departments.map((dept, index) => (
                        <label key={`dept-${index}`} className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.includes(`department-${dept}`)}
                            onChange={() => handleRecipientToggle(`department-${dept}`)}
                            className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                          />
                          <span className="text-sm text-gray-700">
                            Setor: {dept}
                          </span>
                        </label>
                      ))}

                      {/* Individual users */}
                      {protocolParticipants.users.map((userName, index) => (
                        <label key={`user-${index}`} className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.includes(`user-${userName}`)}
                            onChange={() => handleRecipientToggle(`user-${userName}`)}
                            className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                          />
                          <span className="text-sm text-gray-700">
                            {userName}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 mt-2">
                  💡 Selecione para quem deseja enviar esta resposta. Se não selecionar nada, será enviado para todos.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#FF6B35] hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Resposta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Digital Signature Confirmation Modal */}
      <DigitalSignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onConfirm={async (password) => {
          setShowSignatureModal(false);
          // Get form data and process response
          const formData = {
            content: editorRef.current?.getContent() || '',
            is_internal: watch('is_internal'),
            attachments
          };
          await processResponse(formData);
        }}
        signatureType={signatureType}
        signatureTarget={signatureTarget}
        attachments={pdfAttachments}
        protocolNumber={protocolInfo?.number}
        protocolInfo={protocolInfo}
        userInfo={user}
        messageContent={editorRef.current?.getContent()}
      />
    </div>
  );
};

export default ResponseModal;
