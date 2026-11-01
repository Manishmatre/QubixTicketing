import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './services/socket.js';
import { seedDatabase } from './scripts/seed.js';

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Run initial seeder if enabled
    if (process.env.SEED_ON_START !== 'false') {
      await seedDatabase();
    }

    // 3. Initialize Express & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Attach Socket.IO
    initSocket(server);

    // 5. Start Listening
    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Godspeed Ticketing Backend API is live on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server listening for real-time events`);
      console.log(`🏢 Godspeed dedicated operations desk active`);
      console.log(`======================================================\n`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully terminating Godspeed Desk...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Successfully shut down.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err: any) {
    console.error('Fatal startup error in Godspeed Desk server:', err);
    process.exit(1);
  }
}

bootstrap();

