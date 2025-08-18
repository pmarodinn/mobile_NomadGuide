// NomadGuide Backend API
// Entry point for Express server

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import db from './lib/database';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import budgetRoutes from './routes/budgets';
import { initializeDefaultCategories } from './controllers/categoryController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Test database connection
    await db.$connect();
    const userCount = await db.user.count();
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'NomadGuide API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        userCount
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'NomadGuide API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// API routes
app.get('/api/v1', (_req, res) => {
  res.json({
    message: 'Welcome to NomadGuide API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      budgets: '/api/v1/budgets',
      categories: '/api/v1/categories'
    }
  });
});

// Mount auth routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/budgets', budgetRoutes);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 NomadGuide API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Initialize default categories
  await initializeDefaultCategories();
});

export default app;
