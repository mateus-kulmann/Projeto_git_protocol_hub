import React, { useState, useEffect } from 'react';
import { Clock, User, MessageSquare, ArrowRight, Eye, EyeOff, ChevronDown, ChevronRight, Paperclip, FileText, Download, Mail, Smartphone, Send, CheckCircle, XCircle, MessageCircleMore } from 'lucide-react';
import { apiService } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utility function to handle attachment download
const handleDownloadAttachment = async (attachment: any) => {
  try {
    const { data } = supabase.storage
      .from('protocol-attachments')
      .getPublicUrl(attachment.nome_do_arquivo);
    
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  } catch (error) {
    console.error('Error downloading attachment:', error);
  }
};

interface TimelineItem {
  id: string;
  action_type: string;
  action_description: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  created_at: string;
  users: {
    nome: string;
    email: string;
  };
  protocol_audit_views?: Array<{
    id: string;
    users: {
      nome: string;
      email: string;
    };
    user_type: string;
    department_name?: string;
    access_channel: string;
    viewed_at: string;
    user_ip?: string;
    user_agent?: string;
  }>;
}

interface ProtocolTimelineProps {
  protocolId: string;
}

const ProtocolTimeline: React.FC<ProtocolTimelineProps> = ({ protocolId }) => {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedViews, setExpandedViews] = useState<Set<string>>(new Set());
  const [expandedDelivery, setExpandedDelivery] = useState<Set<string>>(new Set());
  const [attachments, setAttachments] = useState<any[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<{[key: string]: any[]}>({});
  const { user } = useAuth();

  useEffect(() => {
    loadTimeline();
    loadAttachments();
    loadDeliveryStatus();
  }, [protocolId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!protocolId) {
        setError('ID do protocolo não fornecido');
        return;
      }
      
      const auditTrail = await apiService.getProtocolAuditTrail(protocolId);
      
      // Filter out initial protocol creation messages that should appear in protocol info
      const filteredAuditTrail = auditTrail.filter(item => {
        // Keep system messages that are not initial description
        if (item.action_type === 'message' || item.action_type === 'internal_message') {
          // Filter out initial description messages (those that are not status changes, assignments, etc.)
          if (item.new_value && 
              !item.new_value.includes('Status alterado') &&
              !item.new_value.includes('Protocolo criado por') &&
              !item.new_value.includes('atribuído') &&
              !item.new_value.includes('encaminhado') &&
              item.action_description.includes('Protocolo criado por')) {
            return false; // This is likely the initial description, don't show in timeline
          }
        }
        return true;
      });
      
      setTimeline(filteredAuditTrail);

      // Debug: verificar se os dados do audit trail estão completos
      console.log('🔍 Audit Trail do banco:', auditTrail.map(item => ({
        id: item.id,
        action_type: item.action_type,
        description_length: item.action_description?.length,
        new_value_length: item.new_value?.length,
        description_preview: item.action_description?.substring(0, 100) + '...',
        new_value_preview: item.new_value?.substring(0, 100) + '...',
        full_description: item.action_description,
        full_new_value: item.new_value
      })));

      // Mark entries as viewed for current user
      if (user?.id) {
        for (const item of filteredAuditTrail) {
          try {
            await apiService.markAuditEntryAsViewed(item.id, user.id, 'internal', 'web');
          } catch (error) {
            console.warn('Could not mark audit entry as viewed:', error);
          }
        }
      }
    } catch (err) {
      console.error('Error loading timeline:', err);
      setError('Erro ao carregar histórico de tramitações');
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryStatus = async () => {
    try {
      // For now, create mock delivery status data
      // In the future, this will come from notifications_log table
      const mockDeliveryData = {
        // This would be keyed by message ID or audit log ID
        'sample-message-1': [
          {
            id: '1',
            channel: 'email',
            status: 'read',
            sent_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            delivered_at: new Date(Date.now() - 3500000).toISOString(), // 55 min ago
            received_at: new Date(Date.now() - 3400000).toISOString(), // 50 min ago
            opened_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
            recipient: 'cliente@exemplo.com'
          }
        ]
      };
      
      setDeliveryStatus(mockDeliveryData);
    } catch (error) {
      console.error('Error loading delivery status:', error);
    }
  };

  const loadAttachments = async () => {
    try {
      const { data: attachments, error } = await supabase
        .from('protocol_attachments')
        .select(`
          *,
          users!protocol_attachments_uploaded_by_fkey(nome)
        `)
        .eq('protocol_id', protocolId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading attachments:', error);
        return;
      }

      setAttachments(attachments || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };
  
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'status_change':
        return <ArrowRight className="w-4 h-4" />;
      case 'assignment':
        return <User className="w-4 h-4" />;
      case 'forward':
        return <ArrowRight className="w-4 h-4" />;
      case 'message':
      case 'internal_message':
        return <MessageSquare className="w-4 h-4" />;
      case 'attachment':
        return <Paperclip className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'status_change':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'assignment':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'forward':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'message':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'internal_message':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'attachment':
        return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionLabel = (actionType: string) => {
    const labels = {
      'status_change': 'Mudança de Status',
      'assignment': 'Atribuição',
      'forward': 'Encaminhamento',
      'message': 'Mensagem',
      'internal_message': 'Mensagem Interna',
      'created': 'Criação',
      'attachment': 'Anexo Adicionado'
    };
    return labels[actionType] || actionType;
  };

  const toggleViewsExpansion = (itemId: string) => {
    setExpandedViews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleDeliveryExpansion = (itemId: string) => {
    setExpandedDelivery(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'whatsapp':
        return <Smartphone className="w-3 h-3" />;
      case 'sms':
        return <MessageCircleMore className="w-3 h-3" />;
      default:
        return <Send className="w-3 h-3" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
      case 'delivered':
      case 'received':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'sent':
        return <Send className="w-3 h-3 text-blue-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'sent': 'Enviada',
      'delivered': 'Entregue',
      'failed': 'Não entregue',
      'received': 'Recebida',
      'read': 'Lida'
    };
    return labels[status] || status;
  };

  const getChannelLabel = (channel: string) => {
    const labels = {
      'email': 'Email',
      'whatsapp': 'WhatsApp',
      'sms': 'SMS',
      'push': 'Push'
    };
    return labels[channel] || channel;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">{error}</div>
        <button
          onClick={loadTimeline}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma tramitação encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-visible">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Histórico de Tramitações
      </h3>
      
      <div className="space-y-4 overflow-visible">
        {timeline.map((item, index) => (
          <div key={item.id} className="relative overflow-visible">
            {/* Timeline line */}
            {index < timeline.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
            )}
            
            <div className="flex items-start space-x-4 overflow-visible">
              {/* Icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getActionColor(item.action_type)}`}>
                {getActionIcon(item.action_type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-visible">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm overflow-visible">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {getActionLabel(item.action_type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        por {item.users.nome}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  
                  {/* Description */}
                  {(item.action_type === 'message' || item.action_type === 'internal_message') ? (
                    <div className="text-sm text-gray-700 mb-2 overflow-visible">
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-200 overflow-visible">
                        <div
                          className="whitespace-pre-wrap break-words leading-relaxed protocol-timeline-message"
                          style={{
                            display: 'block',
                            width: '100%',
                            minHeight: 'auto',
                            height: 'auto',
                            maxHeight: 'none',
                            overflow: 'visible',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {item.new_value || item.action_description}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="text-sm text-gray-700 mb-2 whitespace-pre-wrap break-words leading-relaxed protocol-timeline-message"
                      style={{
                        display: 'block',
                        width: '100%',
                        minHeight: 'auto',
                        height: 'auto',
                        maxHeight: 'none',
                        overflow: 'visible',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {item.action_description}
                    </div>
                  )}
                  
                  {/* Values */}
                  {(item.old_value || item.new_value) && item.action_type !== 'message' && item.action_type !== 'internal_message' && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {item.old_value && (
                        <div>
                          <span className="font-medium">Valor anterior:</span> {item.old_value}
                        </div>
                      )}
                      {item.new_value && (
                        <div>
                          <span className="font-medium">Novo valor:</span> {item.new_value}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Comment */}
                  {item.comment && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 whitespace-pre-wrap break-words">
                      <span className="font-medium">Comentário:</span> {item.comment}
                    </div>
                  )}
                  
                  {/* Show attachments for message actions */}
                  {(item.action_type === 'message' || item.action_type === 'internal_message') && (
                    (() => {
                      // Find attachments created around the same time as this message
                      const messageTime = new Date(item.created_at).getTime();
                      const relatedAttachments = attachments.filter(att => {
                        const attTime = new Date(att.created_at).getTime();
                        // Consider attachments within 1 minute of the message as related
                        return Math.abs(messageTime - attTime) < 60000;
                      });

                      if (relatedAttachments.length === 0) return null;

                      return (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-1 text-xs font-medium text-gray-600 mb-2">
                            <Paperclip className="w-3 h-3" />
                            <span>Anexos ({relatedAttachments.length})</span>
                          </div>
                          <div className="space-y-1">
                            {relatedAttachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                              >
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-900 truncate">
                                      {attachment.original_name || attachment.nome_do_arquivo}
                                    </p>
                                    <div className="flex items-center space-x-2 text-gray-500">
                                      {attachment.tamanho && (
                                        <span>{formatFileSize(attachment.tamanho)}</span>
                                      )}
                                      {attachment.users?.nome && (
                                        <>
                                          <span>•</span>
                                          <span>por {attachment.users.nome}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownloadAttachment(attachment)}
                                  className="text-indigo-600 hover:text-indigo-800 p-1 flex-shrink-0"
                                  title="Baixar arquivo"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* Delivery Status for messages */}
                  {(item.action_type === 'message' || item.action_type === 'internal_message') && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => toggleDeliveryExpansion(item.id)}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Status de Entrega</span>
                        {expandedDelivery.has(item.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      
                      {expandedDelivery.has(item.id) && (
                        <div className="space-y-2 mt-2">
                          {/* Mock delivery status - replace with real data */}
                          <div className="bg-gray-50 rounded p-2 text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getChannelIcon('email')}
                                <span className="font-medium text-gray-800">Email</span>
                                <span className="text-gray-500">cliente@exemplo.com</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon('read')}
                                <span className="text-green-600 font-medium">Lida</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex items-center justify-between">
                                <span>📤 Enviada:</span>
                                <span>{formatDate(new Date(Date.now() - 3600000).toISOString())}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>📬 Entregue:</span>
                                <span>{formatDate(new Date(Date.now() - 3500000).toISOString())}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>📖 Lida:</span>
                                <span>{formatDate(new Date(Date.now() - 1800000).toISOString())}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Future: WhatsApp, SMS, etc. */}
                          <div className="bg-gray-50 rounded p-2 text-xs opacity-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getChannelIcon('whatsapp')}
                                <span className="font-medium text-gray-800">WhatsApp</span>
                                <span className="text-gray-500">+55 11 99999-9999</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-400 text-xs">Não configurado</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Views */}
                  {item.protocol_audit_views && item.protocol_audit_views.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => toggleViewsExpansion(item.id)}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Visualizado por: {item.protocol_audit_views.length} pessoa{item.protocol_audit_views.length > 1 ? 's' : ''}</span>
                        {expandedViews.has(item.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      
                      {expandedViews.has(item.id) && (
                        <div className="space-y-1 mt-2">
                          {item.protocol_audit_views.map((view) => (
                            <div key={view.id} className="bg-gray-50 rounded p-2 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1 flex-wrap">
                                  <span className="font-medium text-gray-800 text-xs">{view.users?.nome || 'Usuário'}</span>
                                  {view.department_name && (
                                    <span className="text-gray-500 text-xs">• {view.department_name}</span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    view.user_type === 'internal' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {view.user_type === 'internal' ? 'Interno' : 'Externo'}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    view.access_channel === 'web' ? 'bg-gray-100 text-gray-700' :
                                    view.access_channel === 'email' ? 'bg-purple-100 text-purple-700' :
                                    view.access_channel === 'whatsapp' ? 'bg-green-100 text-green-700' :
                                    view.access_channel === 'mobile' ? 'bg-orange-100 text-orange-700' :
                                    'bg-indigo-100 text-indigo-700'
                                  }`}>
                                    {view.access_channel === 'web' ? 'Web' :
                                     view.access_channel === 'email' ? 'Email' :
                                     view.access_channel === 'whatsapp' ? 'WhatsApp' :
                                     view.access_channel === 'mobile' ? 'Mobile' :
                                     view.access_channel || 'Web'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(view.viewed_at)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProtocolTimeline;
