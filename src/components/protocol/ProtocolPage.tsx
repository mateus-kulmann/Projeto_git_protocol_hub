import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  FileText,
  Download,
  Reply,
  Forward,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiService } from '../../services/api';
import { supabase } from '../../lib/supabase';
import ChatWindow from '../chat/ChatWindow';
import ProtocolTimeline from './ProtocolTimeline';
import ResponseModal from './ResponseModal';
import ForwardModal from './ForwardModal';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProtocolPage: React.FC = () => {
  const { protocolNumber } = useParams<{ protocolNumber: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [protocol, setProtocol] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);

  useEffect(() => {
    if (protocolNumber) {
      findAndLoadProtocol();
    }
  }, [protocolNumber]);

  const findAndLoadProtocol = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!protocolNumber) {
        setError('Número do protocolo não fornecido');
        return;
      }

      // Convert URL parameter back to protocol number format
      // URL: 20250101000000001 -> Protocol: 20250101.00000001
      const formattedNumber = protocolNumber.replace(/(\d{8})(\d{8})/, '$1.$2');
      
      // Find protocol by number
      const protocolsData = await apiService.getProtocols({ search: formattedNumber });
      const foundProtocol = protocolsData.protocols.find(p => 
        p.number === formattedNumber || p.number === protocolNumber
      );

      if (!foundProtocol) {
        setError('Protocolo não encontrado');
        return;
      }

      // Load full protocol details
      const data = await apiService.getProtocol(foundProtocol.id);
      setProtocol(data.protocol);
      setMessages(data.messages);
      setAttachments(data.attachments);
    } catch (error) {
      console.error('Error loading protocol:', error);
      setError('Erro ao carregar protocolo');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (newMessage: any) => {
    setMessages(prev => [...prev, newMessage]);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      if (!user || !protocol) {
        throw new Error('Usuário não autenticado ou protocolo não carregado');
      }
      
      await apiService.updateProtocolStatus(protocol.id, newStatus);
      setProtocol(prev => ({ ...prev, status: newStatus }));
      
      findAndLoadProtocol(); // Reload to get updated timeline
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleAssignToMe = async () => {
    try {
      if (!user || !protocol) {
        throw new Error('Usuário não autenticado ou protocolo não carregado');
      }
      
      await apiService.assignProtocol(protocol.id, 'me', user.id);
      findAndLoadProtocol();
      toast.success('Protocolo atribuído com sucesso!');
    } catch (error) {
      console.error('Error assigning protocol:', error);
      toast.error('Erro ao atribuir protocolo');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const handleResponse = () => {
    setShowResponseModal(true);
  };

  const handleForward = () => {
    setShowForwardModal(true);
  };

  const handleBack = () => {
    navigate('/protocols');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
          <span className="ml-3 text-gray-600">Carregando protocolo...</span>
        </div>
      </div>
    );
  }

  if (error || !protocol) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Protocolo não encontrado'}
          </h2>
          <p className="text-gray-600 mb-4">
            O protocolo solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos Protocolos</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-[#404040]">
                Protocolo #{protocol.number}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(protocol.status)}`}>
                {protocol.status}
              </span>
              {getPriorityIcon(protocol.priority)}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResponse}
              className="flex items-center space-x-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Reply className="w-4 h-4" />
              <span>Responder</span>
            </button>
            
            <button
              onClick={handleForward}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Forward className="w-4 h-4" />
              <span>Encaminhar</span>
            </button>
            
            {!protocol.assigned_user_name && (
              <button
                onClick={handleAssignToMe}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assumir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex">
        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Protocol Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-[#404040] mb-4">{protocol.subject}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-600">Solicitante:</span>
                    <p className="font-medium">{protocol.requester_name}</p>
                  </div>
                </div>
                
                {protocol.requester_email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{protocol.requester_email}</p>
                    </div>
                  </div>
                )}
                
                {protocol.requester_phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Telefone:</span>
                      <p className="font-medium">{protocol.requester_phone}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-600">Criado em:</span>
                    <p className="font-medium">
                      {format(new Date(protocol.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Protocol Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-[#404040] mb-4">Informações do Protocolo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tipo:</span>
                  <p className="font-medium capitalize">{protocol.document_type?.replace('_', ' ') || 'Protocolo'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Setor:</span>
                  <p className="font-medium">{protocol.department_name || 'Não definido'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Responsável:</span>
                  <p className="font-medium">{protocol.assigned_user_name || 'Não atribuído'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Canal:</span>
                  <p className="font-medium capitalize">{protocol.channel}</p>
                </div>
                <div>
                  <span className="text-gray-600">Prioridade:</span>
                  <p className="font-medium capitalize">{protocol.priority}</p>
                </div>
              </div>
              
              {/* Show initial message if it exists */}
              {(() => {
                const initialMessage = messages.find(msg => 
                  msg.sender_type === 'system' && 
                  msg.type === 'message' &&
                  msg.content && 
                  !msg.content.includes('Status alterado') &&
                  !msg.content.includes('Protocolo criado por') &&
                  !msg.content.includes('atribuído') &&
                  !msg.content.includes('encaminhado')
                );
                
                if (initialMessage) {
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-gray-600 text-sm font-medium">Descrição inicial:</span>
                      <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <div 
                          className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: initialMessage.content }}
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Show initial attachments if they exist */}
              {(() => {
                const protocolTime = new Date(protocol.created_at).getTime();
                const initialAttachments = attachments.filter(att => {
                  const attTime = new Date(att.created_at).getTime();
                  return Math.abs(protocolTime - attTime) < 60000; // 1 minute
                });
                
                if (initialAttachments.length > 0) {
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-gray-600 text-sm font-medium">Anexos iniciais:</span>
                      <div className="mt-2 space-y-2">
                        {initialAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                          >
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-sm font-medium">{attachment.original_name || attachment.filename}</span>
                                <p className="text-xs text-gray-500">
                                  {attachment.uploaded_by_name && `Enviado por ${attachment.uploaded_by_name}`}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const { data: { publicUrl } } = supabase.storage
                                  .from('protocol-attachments')
                                  .getPublicUrl(attachment.file_path);
                                window.open(publicUrl, '_blank');
                              }}
                              className="text-[#FF6B35] hover:text-orange-600"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Status actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-[#404040] mb-4">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-3">
                {protocol.status !== 'in_progress' && (
                  <button 
                    onClick={() => handleStatusChange('in_progress')}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Em Andamento</span>
                  </button>
                )}
                
                {protocol.status !== 'pending' && (
                  <button 
                    onClick={() => handleStatusChange('pending')}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Pendente</span>
                  </button>
                )}
                
                {protocol.status !== 'closed' && (
                  <button 
                    onClick={() => handleStatusChange('closed')}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Finalizar Protocolo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-[#404040] mb-4">Anexos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium">{attachment.original_name || attachment.filename}</span>
                          <p className="text-xs text-gray-500">
                            {attachment.uploaded_by_name && `Enviado por ${attachment.uploaded_by_name}`}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const { data: { publicUrl } } = supabase.storage
                            .from('protocol-attachments')
                            .getPublicUrl(attachment.file_path);
                          window.open(publicUrl, '_blank');
                        }}
                        className="text-[#FF6B35] hover:text-orange-600 p-2"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <ProtocolTimeline protocolId={protocol.id} />
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {protocol.chat_active === 1 && (
          <div className="w-96 bg-white border-l border-gray-200 p-6">
            <div className="sticky top-6">
              <ChatWindow
                protocolId={protocol.id}
                messages={messages}
                onNewMessage={handleNewMessage}
                clientOnline={protocol.client_online === 1}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      <ResponseModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        protocolId={protocol.id}
        onMessageSent={() => {
          findAndLoadProtocol();
          setShowResponseModal(false);
        }}
      />
      
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        protocolId={protocol.id}
        onForwarded={() => {
          findAndLoadProtocol();
          setShowForwardModal(false);
        }}
      />
    </div>
  );
};

export default ProtocolPage;