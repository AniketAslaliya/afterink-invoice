import express, { Request, Response } from 'express';
import { IApiResponse } from '../types';
import Settings from '../models/Settings';

const router = express.Router();

// Get settings
router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch settings', details: err }, timestamp: new Date().toISOString() });
  }
});

// Update settings
router.post('/', async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Failed to update settings', details: err }, timestamp: new Date().toISOString() });
  }
});

export default router; 