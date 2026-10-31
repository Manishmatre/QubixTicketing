import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

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
      }
    });

    // Client leaves organization room
    socket.on('leave:organization', (organizationId: string) => {
      if (organizationId) {
        socket.leave(`org_${organizationId}`);
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
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
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

