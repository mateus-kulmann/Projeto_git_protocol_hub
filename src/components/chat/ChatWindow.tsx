import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Circle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  sender_type: string;
  user_name?: string;
  attachments: any[];
  created_at: string;
}

interface ChatWindowProps {
  protocolId: string;
  messages: Message[];
  onNewMessage: (message: Message) => void;
  clientOnline?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  protocolId, 
  messages, 
  onNewMessage,
  clientOnline = false 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message: Message) => {
        onNewMessage(message);
      });

      socket.on('user_typing', (data) => {
        if (data.user_type === 'client') {
          setTypingUser('Cliente está digitando...');
        }
      });

      socket.on('user_stop_typing', () => {
        setTypingUser(null);
      });

      return () => {
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('user_stop_typing');
      };
    }
  }, [socket, onNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      protocol_id: protocolId,
      content: newMessage.trim(),
      sender_type: 'agent'
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing_start', { protocol_id: protocolId });
      
      setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing_stop', { protocol_id: protocolId });
      }, 1000);
    }
  };

  const chatMessages = messages.filter(msg => msg.sender_type !== 'system');

  return (
    <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#404040]">Chat em Tempo Real</h3>
          <div className="flex items-center space-x-2">
            {clientOnline ? (
              <div className="flex items-center text-green-600 text-sm">
                <Circle className="w-2 h-2 fill-current mr-1" />
                Cliente online
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Cliente offline</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_type === 'agent'
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-gray-100 text-[#404040]'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <div className={`text-xs mt-1 ${
                message.sender_type === 'agent' ? 'text-orange-100' : 'text-gray-500'
              }`}>
                {format(new Date(message.created_at), 'HH:mm')}
              </div>
            </div>
          </div>
        ))}
        
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs text-gray-500">{typingUser}</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-[#FF6B35] transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-[#FF6B35] transition-colors">
            <Smile className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              rows={1}
              disabled={!clientOnline}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !clientOnline}
            className="p-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {!clientOnline && (
          <p className="text-xs text-gray-500 mt-2">
            Cliente offline - As mensagens serão entregues quando ele retornar
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
