import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

// Track active online users per organization
const socketUserMap = new Map<string, { userId?: string; orgId?: string }>();
const orgOnlineUsers = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    // Client joins organization room
    socket.on('join:organization', (organizationId: string) => {
      if (organizationId) {
        socket.join(`org_${organizationId}`);
        const entry = socketUserMap.get(socket.id) || {};
        entry.orgId = organizationId;
        socketUserMap.set(socket.id, entry);

        if (entry.userId) {
          if (!orgOnlineUsers.has(organizationId)) {
            orgOnlineUsers.set(organizationId, new Set());
          }
          orgOnlineUsers.get(organizationId)!.add(entry.userId);
          io?.to(`org_${organizationId}`).emit('presence:sync', {
            onlineUserIds: Array.from(orgOnlineUsers.get(organizationId)!),
          });
        }
      }
    });

    // Client leaves organization room
    socket.on('leave:organization', (organizationId: string) => {
      if (organizationId) {
        socket.leave(`org_${organizationId}`);
        const entry = socketUserMap.get(socket.id);
        if (entry && entry.userId) {
          const set = orgOnlineUsers.get(organizationId);
          if (set) {
            set.delete(entry.userId);
            io?.to(`org_${organizationId}`).emit('presence:sync', {
              onlineUserIds: Array.from(set),
            });
          }
        }
      }
    });

    // Client joins ticket room for live comments and drawer updates
    socket.on('join:ticket', (ticketId: string) => {
      if (ticketId) {
        socket.join(`ticket_${ticketId}`);
      }
    });

    socket.on('leave:ticket', (ticketId: string) => {
      if (ticketId) {
        socket.leave(`ticket_${ticketId}`);
      }
    });

    // Client joins user personal room for private notifications
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(`user_${userId}`);
        const entry = socketUserMap.get(socket.id) || {};
        entry.userId = userId;
        socketUserMap.set(socket.id, entry);

        if (entry.orgId) {
          if (!orgOnlineUsers.has(entry.orgId)) {
            orgOnlineUsers.set(entry.orgId, new Set());
          }
          orgOnlineUsers.get(entry.orgId)!.add(userId);
          io?.to(`org_${entry.orgId}`).emit('presence:sync', {
            onlineUserIds: Array.from(orgOnlineUsers.get(entry.orgId)!),
          });
        }
      }
    });

    socket.on('disconnect', () => {
      const entry = socketUserMap.get(socket.id);
      if (entry && entry.orgId && entry.userId) {
        const set = orgOnlineUsers.get(entry.orgId);
        if (set) {
          set.delete(entry.userId);
          io?.to(`org_${entry.orgId}`).emit('presence:sync', {
            onlineUserIds: Array.from(set),
          });
        }
      }
      socketUserMap.delete(socket.id);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

export const emitToOrg = (organizationId: string, event: string, data: any) => {
  if (io) {
    io.to(`org_${organizationId}`).emit(event, data);
  }
};

export const emitToTicket = (ticketId: string, event: string, data: any) => {
  if (io) {
    io.to(`ticket_${ticketId}`).emit(event, data);
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};
