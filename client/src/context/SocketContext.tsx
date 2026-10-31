import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUserIds: [],
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const { user, organization } = useAuth();

  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (window.location.port === '5173' ? 'http://localhost:4000' : window.location.origin);

    const socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (organization?.id) {
        socketInstance.emit('join:organization', organization.id);
      }
      if (user?.id) {
        socketInstance.emit('join:user', user.id);
      }
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('presence:sync', (data: { onlineUserIds: string[] }) => {
      if (Array.isArray(data?.onlineUserIds)) {
        setOnlineUserIds(data.onlineUserIds);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      if (organization?.id) {
        socket.emit('join:organization', organization.id);
      }
      if (user?.id) {
        socket.emit('join:user', user.id);
      }
    }
  }, [organization?.id, user?.id, isConnected, socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUserIds }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
