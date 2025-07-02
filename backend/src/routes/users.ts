import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import User from '../models/User';
import { IApiResponse } from '../types';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { user: req.user },
    timestamp: new Date().toISOString(),
  });
});

// Update current user profile
router.put('/profile', 
  authenticate,
  [
    body('firstName').optional().trim().isLength({ max: 50 }),
    body('lastName').optional().trim().isLength({ max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      const user = await User.findByIdAndUpdate(req.user!._id, req.body, { new: true });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      res.json({
        success: true,
        data: { user, message: 'Profile updated successfully' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update profile', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Upload avatar (placeholder)
router.post('/upload-avatar', authenticate, async (req: Request, res: Response) => {
  // Placeholder for avatar upload logic
  res.json({
    success: true,
    data: { message: 'Avatar uploaded successfully (not implemented)' },
    timestamp: new Date().toISOString(),
  });
});

// Get all users (admin/manager only)
router.get('/', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const filter = req.query.filter ? JSON.parse(req.query.filter as string) : {};
    const query: any = { ...filter };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch users', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Create new user (admin only)
router.post('/', 
  authenticate, 
  authorize('admin'),
  [
    body('firstName').trim().notEmpty().isLength({ max: 50 }),
    body('lastName').trim().notEmpty().isLength({ max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['admin', 'manager', 'employee']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { message: 'User with this email already exists' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      const user = new User(req.body);
      await user.save();
      res.status(201).json({
        success: true,
        data: { user, message: 'User created successfully' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create user', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Update user (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
    res.json({
      success: true,
      data: { user, message: 'User updated successfully' },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Delete/deactivate user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
    res.json({
      success: true,
      data: { user, message: 'User deactivated successfully' },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to deactivate user', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

export default router; 