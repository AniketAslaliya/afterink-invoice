import express, { Request, Response } from 'express';
import { IApiResponse } from '../types';

const router = express.Router();

// In-memory settings store (replace with DB in production)
let settings: any = {
  business: {},
  notifications: {},
  preferences: {},
  security: {},
  termsAndConditions: ''
};

// Get settings
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: settings,
    timestamp: new Date().toISOString(),
  } as IApiResponse);
});

// Update settings
router.post('/', (req: Request, res: Response) => {
  settings = { ...settings, ...req.body };
  res.json({
    success: true,
    data: settings,
    timestamp: new Date().toISOString(),
  } as IApiResponse);
});

export default router; 