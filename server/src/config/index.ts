import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/gigflow',
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

// Validate critical configurations
if (config.nodeEnv === 'production' && config.jwtSecret === 'your_super_secret_jwt_key_here') {
  console.warn('WARNING: JWT_SECRET has not been changed from default in production environment!');
}
