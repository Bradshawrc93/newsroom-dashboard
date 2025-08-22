import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// THEN import config after dotenv is loaded
import { config, validateEnvironment, isDevelopment, isProduction } from './config/environment';

// Validate environment
validateEnvironment();

// Create Express app
const app = express();
const PORT = config.PORT;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Rate limiting - enabled in production
if (config.RATE_LIMIT_ENABLED) {
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);
  console.log('✅ Rate limiting enabled');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Debug endpoint - only available in development
if (isDevelopment) {
  app.get('/debug/env', (req, res) => {
    res.json({
      slackBotToken: config.SLACK_BOT_TOKEN ? 'Present' : 'Missing',
      slackBotTokenStart: config.SLACK_BOT_TOKEN ? config.SLACK_BOT_TOKEN.substring(0, 10) + '...' : 'None',
      openaiApiKey: config.OPENAI_API_KEY ? 'Present' : 'Missing',
      environment: config.NODE_ENV,
      rateLimitEnabled: config.RATE_LIMIT_ENABLED,
    });
  });
}

// Import routes
import messageRoutes from './routes/messages';
import aiRoutes from './routes/ai';
import learningRoutes from './routes/learning';

// API routes
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/learning', learningRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
  });
});

// Import initialization
import { initializeData } from './utils/initializeData';

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  
  // Initialize data
  await initializeData();
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
