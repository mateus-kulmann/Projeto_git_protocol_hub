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

interface ProtocolListItemProps {
  protocol: Protocol;
}

const ProtocolListItem: React.FC<ProtocolListItemProps> = ({ protocol }) => {
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

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-gray-300';
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
    <tr 
      className={`hover:bg-gray-50 cursor-pointer transition-colors ${getPriorityBorder(protocol.priority)}`}
      onClick={handleClick}
    >
      {/* Protocol Number */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-bold text-[#FF6B35]">
            #{protocol.number}
          </span>
          {getChannelIcon()}
          {protocol.unread_count && protocol.unread_count > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {protocol.unread_count}
            </span>
          )}
          {protocol.chat_active === 1 && (
            <MessageCircle className="w-4 h-4 text-[#FF6B35]" />
          )}
        </div>
      </td>

      {/* Subject */}
      <td className="px-4 py-3">
        <div className="text-xs font-medium text-gray-900 max-w-xs truncate">
          {protocol.subject}
        </div>
      </td>

      {/* Requester */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <User className="w-3 h-3 text-gray-400 mr-1" />
          <div>
            <div className="text-xs font-medium text-gray-900">
              {protocol.requester_name}
            </div>
            {protocol.requester_email && (
              <div className="text-xs text-gray-500 truncate max-w-32">
                {protocol.requester_email}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(protocol.status)}`}>
          {getStatusLabel(protocol.status)}
        </span>
      </td>

      {/* Department */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-xs text-gray-900">
          {protocol.department_name || 'Não definido'}
        </div>
        {protocol.assigned_user_name && (
          <div className="text-xs text-gray-500">
            {protocol.assigned_user_name}
          </div>
        )}
      </td>

      {/* Updated At */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          <span>
            {formatDistanceToNow(new Date(protocol.updated_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </span>
        </div>
      </td>
    </tr>
  );
};

export default ProtocolListItem;
