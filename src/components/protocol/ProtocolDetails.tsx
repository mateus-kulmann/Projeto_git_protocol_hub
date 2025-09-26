import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  AlertCircle,
  ExternalLink,
  ArrowRight,
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

interface ProtocolDetailsProps {
  protocolId: string;
  onClose: () => void;
}

const ProtocolDetails: React.FC<ProtocolDetailsProps> = ({ protocolId, onClose }) => {
  const { user } = useAuth();
  const [protocol, setProtocol] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);

  useEffect(() => {
    loadProtocolDetails();
  }, [protocolId]);

  const loadProtocolDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProtocol(protocolId);
      setProtocol(data.protocol);
      setMessages(data.messages);
      setAttachments(data.attachments);
    } catch (error) {
      console.error('Error loading protocol details:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleNewMessage = (newMessage: any) => {
    setMessages(prev => [...prev, newMessage]);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const statusLabels = {
        'in_progress': 'Em Andamento',
        'pending': 'Pendente', 
        'closed': 'Finalizado'
      };
      
      const comment = `Status alterado para: ${statusLabels[newStatus]}`;
      await apiService.updateProtocolStatus(protocolId, newStatus);
      setProtocol(prev => ({ ...prev, status: newStatus }));
      
      loadProtocolDetails(); // Reload to get updated timeline
    } catch (error) {
      console.error('Error updating status:', error);
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

  const handleAssignToMe = async () => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      await apiService.assignProtocol(protocolId, 'me', user.id);
      loadProtocolDetails();
    } catch (error) {
      console.error('Error assigning protocol:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35] mx-auto"></div>
          <p className="mt-4 text-center">Carregando protocolo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex h-full">
          {/* Main content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-[#404040]">
                      Protocolo #{protocol?.number}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(protocol?.status)}`}>
                      {protocol?.status}
                    </span>
                    {getPriorityIcon(protocol?.priority)}
                  </div>
                  
                  <p className="text-lg text-gray-700 mb-4">{protocol?.subject}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{protocol?.requester_name}</span>
                    </div>
                    {protocol?.requester_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{protocol?.requester_email}</span>
                      </div>
                    )}
                    {protocol?.requester_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{protocol?.requester_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {format(new Date(protocol?.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center space-x-2 mt-4">
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
                  
                  {!protocol?.assigned_user_name && (
                    <button
                      onClick={handleAssignToMe}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Assumir</span>
                    </button>
                  )}
                </div>
                
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold p-2"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex min-h-0">
              {/* Left side - Protocol info and timeline */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Protocol info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-[#404040] mb-3">Informações do Protocolo</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Tipo:</span>
                        <p className="font-medium capitalize">{protocol?.document_type?.replace('_', ' ') || 'Protocolo'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Setor:</span>
                        <p className="font-medium">{protocol?.department_name || 'Não definido'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Responsável:</span>
                        <p className="font-medium">{protocol?.assigned_user_name || 'Não atribuído'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Canal:</span>
                        <p className="font-medium capitalize">{protocol?.channel}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Prioridade:</span>
                        <p className="font-medium capitalize">{protocol?.priority}</p>
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
                            <div className="mt-2 p-3 bg-white rounded border border-gray-200">
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
                      // Find attachments created within 1 minute of protocol creation
                      const protocolTime = new Date(protocol?.created_at).getTime();
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
                                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
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
                                      // Create download link
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
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold text-[#404040] mb-3">Ações</h3>
                    <div className="flex flex-wrap gap-2">
                      {protocol?.status !== 'in_progress' && (
                        <button 
                          onClick={() => handleStatusChange('in_progress')}
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Em Andamento</span>
                        </button>
                      )}
                      
                      {protocol?.status !== 'pending' && (
                        <button 
                          onClick={() => handleStatusChange('pending')}
                          className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Pendente</span>
                        </button>
                      )}
                      
                      {protocol?.status !== 'closed' && (
                        <button 
                          onClick={() => handleStatusChange('closed')}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Finalizar Protocolo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Attachments */}
                  {attachments.length > 0 && (
                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="font-semibold text-[#404040] mb-3">Anexos</h3>
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
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
                                // Create download link
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
                  )}

                  {/* Timeline */}
                  <div className="w-full overflow-visible">
                    <ProtocolTimeline protocolId={protocolId} />
                  </div>
                </div>
              </div>

              {/* Right side - Chat */}
              {protocol?.chat_active === 1 && (
                <div className="w-80 border-l border-gray-200 p-4">
                  <ChatWindow
                    protocolId={protocolId}
                    messages={messages}
                    onNewMessage={handleNewMessage}
                    clientOnline={protocol?.client_online === 1}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ResponseModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        protocolId={protocolId}
        onMessageSent={() => {
          loadProtocolDetails();
          setShowResponseModal(false);
        }}
      />
      
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        protocolId={protocolId}
        onForwarded={() => {
          loadProtocolDetails();
          setShowForwardModal(false);
        }}
      />
    </div>
  );
};

export default ProtocolDetails;
