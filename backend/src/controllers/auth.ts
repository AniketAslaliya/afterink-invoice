import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { ILoginRequest, IRegisterRequest, IApiResponse } from '../types';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    const { firstName, lastName, email, password, role = 'employee' }: IRegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          message: 'User with this email already exists',
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
        tokens,
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during registration',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    const { email, password }: ILoginRequest = req.body;

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Ready state:', mongoose.connection.readyState);
      res.status(500).json({
        success: false,
        error: {
          message: 'Database connection error',
          details: 'Database is not connected',
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    // Find user with password field included
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated. Please contact administrator.',
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    // Generate tokens
    const tokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Update last login
    await user.updateLastLogin();

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
        tokens,
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);

  } catch (error) {
    console.error('Login error:', error);
    
    // More detailed error logging for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check for specific error types
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      res.status(500).json({
        success: false,
        error: {
          message: 'JWT configuration error - check environment variables',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }
    
    if (error instanceof Error && error.message.includes('MongoDB')) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Database connection error',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during login',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
};

// Refresh access token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    const { refreshToken: token } = req.body;

    try {
      const decoded = verifyRefreshToken(token);
      
      // Verify user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: {
            message: 'User not found or inactive',
          },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
        return;
      }

      // Generate new tokens
      const tokenPayload = {
        userId: (user._id as any).toString(),
        email: user.email,
        role: user.role,
      };

      const tokens = generateTokenPair(tokenPayload);

      res.status(200).json({
        success: true,
        data: { tokens },
        timestamp: new Date().toISOString(),
      } as IApiResponse);

    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired refresh token',
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during token refresh',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
};

// Logout user (optional - mainly for token blacklisting if implemented)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a full implementation, you might want to blacklist the token
    // For now, just return success
    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during logout',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      res.status(200).json({
        success: true,
        data: {
          message: 'If the email exists, a password reset link will be sent.',
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save reset token to user (you'll need to add these fields to the User model)
    // user.passwordResetToken = resetToken;
    // user.passwordResetExpiry = resetTokenExpiry;
    // await user.save();

    // TODO: Send reset email
    // await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset link sent to email',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
      return;
    }

    const { token, password } = req.body;

    // TODO: Implement password reset logic
    // Find user by reset token and verify expiry
    // Update password and clear reset token

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset successful',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Implement email verification logic
    res.status(200).json({
      success: true,
      data: {
        message: 'Email verified successfully',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
};

// Resend verification email
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Implement resend verification logic
    res.status(200).json({
      success: true,
      data: {
        message: 'Verification email sent',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
}; 