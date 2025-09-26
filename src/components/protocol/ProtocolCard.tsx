import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  User, 
  MessageCircle, 
  Mail, 
  Smartphone,
  FileText,
  Circle,
  Pause
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Protocol {
  id: string;
  number: string;
  document_type?: string;
  subject: string;
  status: string;
  priority: string;
  channel: string;
  requester_name: string;
  requester_email?: string;
  requester_phone?: string;
  department_name?: string;
  assigned_user_name?: string;
  chat_active: number;
  client_online?: number;
  agent_online?: number;
  chat_status?: string;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

interface ProtocolCardProps {
  protocol: Protocol;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Convert protocol number to URL-safe format
    // Remove # and . from protocol number: #20250101.00000001 -> 20250101000000001
    const urlSafeNumber = protocol.number.replace(/[#.]/g, '');
    navigate(`/protocol/${urlSafeNumber}`);
  };

  const getChannelIcon = () => {
    if (protocol.chat_active) {
      if (protocol.chat_status === 'active' && protocol.client_online) {
        return <Circle className="w-4 h-4 text-green-500 fill-current" />;
      } else {
        return <Pause className="w-4 h-4 text-yellow-500" />;
      }
    }
    
    switch (protocol.channel) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'whatsapp':
        return <Smartphone className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'open': 'Aberto',
      'in_progress': 'Em Andamento',
      'pending': 'Pendente',
      'closed': 'Finalizado'
    };
    return labels[status] || status;
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md border-l-4 ${getPriorityColor(protocol.priority)} p-6 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm font-bold text-[#FF6B35]">
            #{protocol.number}
          </span>
          {getChannelIcon()}
          {protocol.unread_count && protocol.unread_count > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {protocol.unread_count}
            </span>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(protocol.status)}`}>
          {getStatusLabel(protocol.status)}
        </span>
      </div>

      <h3 className="font-semibold text-[#404040] mb-2 line-clamp-2">
        {protocol.subject}
      </h3>

      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center space-x-1">
          <User className="w-4 h-4" />
          <span>{protocol.requester_name}</span>
        </div>
        {protocol.department_name && (
          <div className="text-gray-500">
            {protocol.department_name}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(new Date(protocol.updated_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </span>
        </div>
        
        {protocol.assigned_user_name && (
          <span className="bg-gray-100 px-2 py-1 rounded">
            {protocol.assigned_user_name}
          </span>
        )}
      </div>

      {protocol.chat_active === 1 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#FF6B35] font-medium">Chat Ativo</span>
            <div className="flex items-center space-x-2">
              {protocol.client_online ? (
                <span className="flex items-center text-green-600">
                  <Circle className="w-2 h-2 fill-current mr-1" />
                  Cliente online
                </span>
              ) : (
                <span className="text-gray-400">Cliente offline</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolCard;
