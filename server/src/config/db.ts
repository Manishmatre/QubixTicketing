import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri && uri.trim() !== '') {
      console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('[Database] Connected to external MongoDB successfully.');
      return;
    }
  } catch (error: any) {
    console.warn(`[Database] Could not connect to external MongoDB (${error.message}). Falling back to embedded MongoMemoryServer...`);
  }

  try {
    console.log('[Database] Initializing high-performance in-memory MongoDB instance for zero-dependency local execution...');
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'qubix',
      },
    });
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Connected to in-memory MongoDB at: ${memoryUri}`);
  } catch (err: any) {
    console.error('[Database] Failed to initialize embedded MongoDB:', err);
    throw err;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
      console.log('[Database] Stopped in-memory MongoDB instance.');
    }
  } catch (err) {
    console.error('[Database] Error while disconnecting:', err);
  }
};

