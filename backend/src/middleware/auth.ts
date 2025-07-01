import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User';
import { IAuthPayload } from '../types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IAuthPayload & { _id: string };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Access token is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = verifyAccessToken(token);
      
      // Verify user still exists and is active
      const user = await User.findById(decoded.userId).select('+isActive');
      
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: {
            message: 'User not found or inactive',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Attach user to request
      req.user = {
        ...decoded,
        _id: user._id.toString(),
      };

      next();
    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during authentication',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          requiredRoles: roles,
          userRole: req.user.role,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

// Middleware to check if user owns the resource or is admin/manager
export const authorizeOwnerOrAdmin = (userIdField: string = 'createdBy') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Admin and managers can access any resource
    if (['admin', 'manager'].includes(req.user.role)) {
      next();
      return;
    }

    // For other roles, check ownership in the middleware
    // The actual ownership check will be done in the controller
    next();
  };
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('+isActive');
      
      if (user && user.isActive) {
        req.user = {
          ...decoded,
          _id: user._id.toString(),
        };
      }
    } catch (tokenError) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if there's an error
  }
}; 