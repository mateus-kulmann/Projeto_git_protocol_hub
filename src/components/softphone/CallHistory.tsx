import React, { useState, useEffect } from 'react';
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Clock,
  Calendar,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatPhoneNumber } from '../../utils/phoneUtils';

interface CallRecord {
  id: string;
  direction: 'incoming' | 'outgoing';
  phone_number: string;
  duration: number;
  status: 'completed' | 'missed' | 'busy' | 'no-answer' | 'failed';
  started_at: string;
  ended_at: string | null;
  protocol_id: string | null;
  protocol?: {
    numero: number;
    assunto: string;
  };
}

interface CallHistoryProps {
  onSelectNumber: (number: string) => void;
}

const CallHistory: React.FC<CallHistoryProps> = ({ onSelectNumber }) => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCallHistory();
    }
  }, [user]);

  const loadCallHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('call_history')
        .select(`
          *,
          protocol:protocols(numero, assunto)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setCalls(data || []);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.status === 'missed') {
      return <PhoneMissed className="w-5 h-5 text-red-500" />;
    }
    return call.direction === 'incoming' ? (
      <PhoneIncoming className="w-5 h-5 text-green-500" />
    ) : (
      <PhoneOutgoing className="w-5 h-5 text-blue-500" />
    );
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      completed: 'Completada',
      missed: 'Perdida',
      busy: 'Ocupado',
      'no-answer': 'Não atendida',
      failed: 'Falhou'
    };
    return statusMap[status] || status;
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-8">
        <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Nenhuma chamada registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {calls.map((call) => (
        <div
          key={call.id}
          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => onSelectNumber(call.phone_number)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getCallIcon(call)}
              <div>
                <p className="font-medium text-gray-900">
                  {formatPhoneNumber(call.phone_number)}
                </p>
                <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(new Date(call.started_at), "dd/MM", { locale: ptBR })}
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(new Date(call.started_at), "HH:mm", { locale: ptBR })}
                    </span>
                  </span>
                  <span>{formatDuration(call.duration)}</span>
                </div>
                {call.protocol && (
                  <p className="text-xs text-[#FF6B35] mt-1">
                    Protocolo #{call.protocol.numero}
                  </p>
                )}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              call.status === 'completed' ? 'bg-green-100 text-green-700' :
              call.status === 'missed' ? 'bg-red-100 text-red-700' :
              'bg-gray-200 text-gray-600'
            }`}>
              {getStatusText(call.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CallHistory;
