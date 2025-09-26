import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinProtocol: (protocolId: string) => void;
  leaveProtocol: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentProtocol, setCurrentProtocol] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:3001');
      
      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const joinProtocol = (protocolId: string) => {
    if (socket && user) {
      if (currentProtocol) {
        socket.emit('leave_protocol', { protocol_id: currentProtocol });
      }
      
      socket.emit('join_protocol', {
        protocol_id: protocolId,
        user_id: user.id,
        user_type: 'agent'
      });
      
      setCurrentProtocol(protocolId);
    }
  };

  const leaveProtocol = () => {
    if (socket && currentProtocol) {
      socket.emit('leave_protocol', { protocol_id: currentProtocol });
      setCurrentProtocol(null);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinProtocol, leaveProtocol }}>
      {children}
    </SocketContext.Provider>
  );
};
