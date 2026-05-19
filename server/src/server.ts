import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';

const startServer = async (): Promise<void> => {
  // Connect to Database
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
};

startServer();
