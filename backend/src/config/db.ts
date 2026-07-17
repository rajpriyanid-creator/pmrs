import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

mongoose.set('strictQuery', true);
// Prevents Mongoose from casting/accepting unknown-shaped operator injection
// on top of express-mongo-sanitize at the HTTP layer.
mongoose.set('sanitizeFilter', true);

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGO_URI, {
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 10000,
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
}
