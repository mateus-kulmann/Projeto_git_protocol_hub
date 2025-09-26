import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Forward, Building, User, Upload, FileText, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import RichTextEditor, { RichTextEditorRef } from '../common/RichTextEditor';
import DigitalSignatureModal from '../common/DigitalSignatureModal';
import SignatureRequestSection from '../common/SignatureRequestSection';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocolId: string;
  onForwarded: () => void;
}

interface ForwardFormData {
  department_id: string;
  assigned_user_id?: string;
  comment: string;
  attachments?: File[];
}

const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  onClose,
  protocolId,
  onForwarded
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatureType, setSignatureType] = useState('');
  const [signatureTarget, setSignatureTarget] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const editorRef = React.useRef<RichTextEditorRef>(null);
  
  const [protocolInfo, setProtocolInfo] = useState<any>(null);
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ForwardFormData>();

  const selectedDepartment = watch('department_id');

  // Filter PDF attachments
  const pdfAttachments = attachments.filter(file => 
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      loadProtocolInfo();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDepartment) {
      loadUsers(selectedDepartment);
    }
  }, [selectedDepartment]);

  const loadDepartments = async () => {
    try {
      const data = await apiService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadUsers = async (departmentId: string) => {
    try {
      // Mock users for now - you can implement this endpoint later
      setUsers([
        { id: '1', name: 'João Silva' },
        { id: '2', name: 'Maria Santos' },
        { id: '3', name: 'Pedro Costa' }
      ]);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadProtocolInfo = async () => {
    try {
      const data = await apiService.getProtocol(protocolId);
      setProtocolInfo(data.protocol);
    } catch (error) {
      console.error('Error loading protocol info:', error);
    }
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

  const onSubmit = async (data: ForwardFormData) => {
    // If signature is enabled, show signature confirmation modal
    if (signatureEnabled && signatureType && signatureTarget) {
      setShowSignatureModal(true);
      return;
    }

    await processForward(data);
  };

  const processForward = async (data: ForwardFormData) => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get rich text content from editor
      const comment = editorRef.current?.getContent() || '';
      const mentions = editorRef.current?.getMentions() || [];
      
      setLoading(true);
      
      await apiService.forwardProtocol(protocolId, {
        department_id: data.department_id,
        assigned_user_id: data.assigned_user_id,
        comment,
        mentions,
        attachments: attachments.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      }, user.id);
      
      toast.success('Protocolo encaminhado com sucesso!');
      reset();
      setAttachments([]);
      onForwarded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao encaminhar protocolo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setAttachments([]);
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
              <h2 className="text-xl font-bold text-[#404040] mb-3">Encaminhar Protocolo</h2>
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
            {/* Department selection */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#404040] mb-3">Destino do Encaminhamento</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    Setor de Destino *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      {...register('department_id', { required: 'Setor é obrigatório' })}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                        errors.department_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione um setor</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.department_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.department_id.message}</p>
                  )}
                </div>

                {/* User selection (optional) */}
                {selectedDepartment && (
                  <div>
                    <label className="block text-sm font-medium text-[#404040] mb-2">
                      Responsável (Opcional)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        {...register('assigned_user_id')}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                      >
                        <option value="">Atribuição automática</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comment */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#404040] mb-3">Comentário</h3>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Comentário do Encaminhamento *
              </label>
              <RichTextEditor
                ref={editorRef}
                placeholder="Explique o motivo do encaminhamento..."
                protocolId={protocolId}
                height={150}
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

            {/* Digital Signature Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#404040] mb-4">Assinatura Digital</h3>
              
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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Encaminhando...</span>
                </>
              ) : (
                <>
                  <Forward className="w-4 h-4" />
                  <span>Encaminhar</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Digital Signature Confirmation Modal */}
        <DigitalSignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onConfirm={async (password) => {
            setShowSignatureModal(false);
            // Get form data and process forward
            const formData = {
              department_id: watch('department_id'),
              assigned_user_id: watch('assigned_user_id'),
              comment: editorRef.current?.getContent() || ''
            };
            await processForward(formData);
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
    </div>
  );
};

export default ForwardModal;
