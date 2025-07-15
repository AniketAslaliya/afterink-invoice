import { Request, Response } from 'express';
import Bonus from '../models/Bonus';

export const createBonus = async (req: Request, res: Response) => {
  try {
    const { clientId, amount, date, description, category } = req.body;
    const createdBy = req.user?._id;
    const bonus = await Bonus.create({ clientId, amount, date, description, category, createdBy });
    res.status(201).json({ success: true, data: bonus, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const getBonuses = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.query;
    const filter: any = {};
    if (clientId) filter.clientId = clientId;
    const bonuses = await Bonus.find(filter).populate('clientId').sort({ date: -1 });
    res.json({ success: true, data: bonuses, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const getBonusById = async (req: Request, res: Response) => {
  try {
    const bonus = await Bonus.findById(req.params.id).populate('clientId');
    if (!bonus) return res.status(404).json({ success: false, error: { message: 'Bonus not found' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: bonus, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const updateBonus = async (req: Request, res: Response) => {
  try {
    const bonus = await Bonus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bonus) return res.status(404).json({ success: false, error: { message: 'Bonus not found' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: bonus, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const deleteBonus = async (req: Request, res: Response) => {
  try {
    const bonus = await Bonus.findByIdAndDelete(req.params.id);
    if (!bonus) return res.status(404).json({ success: false, error: { message: 'Bonus not found' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: bonus, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
}; 