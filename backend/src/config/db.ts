import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Singleton database connection manager (Singleton Pattern).
 * Guarantees a single shared Mongoose connection across the application.
 */
class Database {
  private static instance: Database;
  private connected = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUrl, { dbName: env.dbName });
    this.connected = true;
    logger.info(`MongoDB connected -> db="${env.dbName}"`);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await mongoose.disconnect();
    this.connected = false;
  }
}

export const database = Database.getInstance();
