import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    throw error;
  }
};

export default connectDB;
