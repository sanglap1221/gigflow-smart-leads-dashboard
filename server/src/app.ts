import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { errorHandler } from './middlewares/error.js';
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/lead.js';

const app = express();

// Standard middlewares
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// Base route for health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler (must be registered last)
app.use(errorHandler);

export default app;
