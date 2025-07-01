import { Request, Response, NextFunction } from 'express';

interface Error {
  message: string;
  status?: number;
  statusCode?: number;
  stack?: string;
  name?: string;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let message = error.message || 'Internal Server Error';
  let statusCode = error.status || error.statusCode || 500;

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    message = 'Validation Error';
    statusCode = 400;
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (error.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    message = 'Invalid ID format';
    statusCode = 400;
  }

  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error
      }),
    },
    timestamp: new Date().toISOString(),
  });
}; 