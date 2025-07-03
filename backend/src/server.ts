/**
 * Afterink Invoice API Server
 * 
 * This is the main server file that sets up and configures the Express.js application
 * for the Afterink Invoice management system. It includes security middleware,
 * rate limiting, CORS configuration, and API route definitions.
 * 
 * @author Afterink Team
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Database configuration
import { connectDatabase } from './config/database';

// Custom middleware imports
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// API route imports - organized by feature
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import clientRoutes from './routes/clients';
import invoiceRoutes from './routes/invoices';
import projectRoutes from './routes/projects';
import settingsRoutes from './routes/settings';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Rate Limiting Configuration
 * 
 * Implements rate limiting to prevent abuse and protect against DDoS attacks.
 * Limits each IP to a maximum number of requests per time window.
 * More relaxed limits for development environment.
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests per window for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for development
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Security and Performance Middleware
 * 
 * These middleware functions enhance security and performance:
 * - helmet: Sets various HTTP headers for security
 * - compression: Compresses response bodies for better performance
 * - morgan: HTTP request logger for monitoring and debugging
 * - limiter: Rate limiting to prevent abuse
 */
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * 
 * Configures CORS to allow frontend applications to communicate with the API.
 * Supports multiple origins and includes credentials for authentication.
 */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://frontend:5173',
    'https://afterinkinvoice.vercel.app',
  ],
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

/**
 * Body Parsing Middleware
 * 
 * Configures Express to parse JSON and URL-encoded request bodies.
 * Sets reasonable size limits to prevent memory exhaustion attacks.
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Static File Serving
 * 
 * Serves uploaded files (invoices, attachments, etc.) from the uploads directory.
 * In production, consider using a CDN or cloud storage service instead.
 */
app.use('/uploads', express.static('uploads'));

/**
 * Health Check Endpoint
 * 
 * Provides a simple health check endpoint for monitoring and load balancer health checks.
 * Returns server status, timestamp, and environment information.
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Afterink Invoice API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * API Route Registration
 * 
 * Registers all API routes with their respective base paths.
 * Each route module handles a specific feature area of the application.
 */
app.use('/api/auth', authRoutes);           // Authentication and authorization
app.use('/api/users', userRoutes);         // User management
app.use('/api/clients', clientRoutes);     // Client management
app.use('/api/invoices', invoiceRoutes);   // Invoice management
app.use('/api/projects', projectRoutes);   // Project management
app.use('/api/settings', settingsRoutes);   // Settings management

/**
 * API Documentation Endpoint
 * 
 * Provides basic API information and endpoint discovery.
 * In production, consider using tools like Swagger/OpenAPI for comprehensive documentation.
 */
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Afterink Invoice API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      clients: '/api/clients',
      invoices: '/api/invoices',
      projects: '/api/projects',
    },
    documentation: 'https://docs.afterink.com/api',
  });
});

/**
 * Error Handling Middleware
 * 
 * These middleware functions handle errors and unknown routes:
 * - notFound: Handles 404 errors for unmatched routes
 * - errorHandler: Global error handler for all application errors
 * 
 * Note: Order matters - these must be registered after all routes.
 */
app.use(notFound);
app.use(errorHandler);

/**
 * Server Startup Function
 * 
 * Initializes the database connection and starts the HTTP server.
 * Includes proper error handling for startup failures.
 */
const startServer = async () => {
  try {
    // Establish database connection before starting server
    await connectDatabase();
    
    // Start the HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful Shutdown Handlers
 * 
 * Handle SIGTERM and SIGINT signals for graceful shutdown.
 * This ensures proper cleanup when the process is terminated.
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

// Export the Express app for testing purposes
export default app; 