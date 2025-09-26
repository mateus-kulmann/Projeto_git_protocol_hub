import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Mail, Phone, FileText, Upload, Trash2, Building2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import RichTextEditor, { RichTextEditorRef } from '../common/RichTextEditor';

interface CreateProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProtocolCreated: () => void;
}

interface CreateProtocolFormData {
  document_type: string;
  subject: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  requester_cpf: string;
  priority: string;
  channel: string;
  description: string;
}

const CreateProtocolModal: React.FC<CreateProtocolModalProps> = ({
  isOpen,
  onClose,
  onProtocolCreated
}) => {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [predefinedSubjects, setPredefinedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [useCustomSubject, setUseCustomSubject] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const editorRef = React.useRef<RichTextEditorRef>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateProtocolFormData>();

  useEffect(() => {
    if (isOpen) {
      loadPredefinedSubjects();
    }
  }, [isOpen]);

  const loadPredefinedSubjects = async () => {
    try {
      // Load predefined subjects based on document type
      // For now, we'll use static data, but this could come from the database later
      setPredefinedSubjects([
        'Solicitação de Suporte Técnico',
        'Problema com Equipamento',
        'Solicitação de Acesso',
        'Alteração de Dados',
        'Reclamação',
        'Sugestão',
        'Informação',
        'Outros'
      ]);
    } catch (error) {
      console.error('Erro ao carregar assuntos:', error);
      toast.error('Erro ao carregar assuntos');
    }
  };

  // Document types
  const documentTypes = [
    { value: 'protocolo', label: 'Protocolo' },
    { value: 'memorando', label: 'Memorando' },
    { value: 'circular', label: 'Circular' },
    { value: 'processo_administrativo', label: 'Processo Administrativo' },
    { value: 'oficio', label: 'Ofício' },
    { value: 'protocolo_servidor', label: 'Protocolo Servidor' },
    { value: 'chamado_tecnico', label: 'Chamado Técnico' }
  ];

  const handleClose = () => {
    reset();
    setAttachments([]);
    setIsDragOver(false);
    setCustomSubject('');
    setUseCustomSubject(false);
    editorRef.current?.clear();
    onClose();
  };

  const onSubmit = async (data: CreateProtocolFormData) => {
    setLoading(true);
    try {
      // Get rich text content from editor
      const description = editorRef.current?.getContent() || '';
      const mentions = editorRef.current?.getMentions() || [];
      
      // Create protocol
      const protocolResponse = await apiService.createProtocol({
        ...data,
        channel: data.channel || 'web',
        description,
        mentions,
        subject: useCustomSubject ? customSubject : data.subject
      });

      const protocolId = protocolResponse.id;

      // Upload attachments if any
      if (attachments.length > 0) {
        // For now, just log the attachments - we'll implement file upload later
        console.log('Attachments to upload:', attachments.map(f => f.name));
      }

      toast.success('Protocolo criado com sucesso!');
      handleClose();
      onProtocolCreated();
    } catch (error: any) {
      console.error('Erro ao criar protocolo:', error);
      toast.error(error.message || 'Erro ao criar protocolo');
    } finally {
      setLoading(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#404040]">Novo Protocolo</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Tipo de Documento *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  {...register('document_type', { required: 'Tipo de documento é obrigatório' })}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                    errors.document_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione o tipo de documento</option>
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.document_type && (
                <p className="mt-1 text-sm text-red-600">{errors.document_type.message}</p>
              )}
            </div>

            {/* Subject and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#404040] mb-2">
                  Assunto *
                </label>
                
                {/* Toggle between predefined and custom */}
                <div className="mb-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={useCustomSubject}
                      onChange={(e) => setUseCustomSubject(e.target.checked)}
                      className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                    />
                    <span className="text-sm text-gray-600">Assunto personalizado</span>
                  </label>
                </div>
                
                {useCustomSubject ? (
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                      placeholder="Digite o assunto personalizado"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      {...register('subject', { required: !useCustomSubject ? 'Assunto é obrigatório' : false })}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                        errors.subject ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione um assunto</option>
                      {predefinedSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {errors.subject && !useCustomSubject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                )}
                {useCustomSubject && !customSubject.trim() && (
                  <p className="mt-1 text-sm text-red-600">Assunto personalizado é obrigatório</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#404040] mb-2">
                  Prioridade *
                </label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    {...register('priority', { required: 'Prioridade é obrigatória' })}
                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                      errors.priority ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione a prioridade</option>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>
            </div>

            {/* Requester Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-[#404040] mb-4">Dados do Solicitante</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...register('requester_name', { required: 'Nome é obrigatório' })}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                        errors.requester_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nome do solicitante"
                    />
                  </div>
                  {errors.requester_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.requester_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      {...register('requester_email', {
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Email inválido'
                        }
                      })}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                        errors.requester_email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  {errors.requester_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.requester_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      {...register('requester_phone')}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    CPF
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...register('requester_cpf')}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Descrição Detalhada
              </label>
              <RichTextEditor
                ref={editorRef}
                placeholder="Descreva detalhadamente o problema ou solicitação..."
                height={150}
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Anexos
              </label>
              
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? 'border-[#FF6B35] bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
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
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-[#404040]">
                    Arquivos Selecionados ({attachments.length})
                  </h4>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
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
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#FF6B35] hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>
                    {attachments.length > 0 ? 'Enviando arquivos...' : 'Criando...'}
                  </span>
                </>
              ) : (
                <span>Criar Documento</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProtocolModal;
