import { Request, Response } from 'express';
import ExpenseReason from '../models/ExpenseReason';

export const createExpenseReason = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user?._id;
    const reason = await ExpenseReason.create({ name, description, createdBy });
    res.status(201).json({ success: true, data: reason, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const getExpenseReasons = async (req: Request, res: Response) => {
  try {
    const reasons = await ExpenseReason.find().sort({ name: 1 });
    res.json({ success: true, data: reasons, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const getExpenseReasonById = async (req: Request, res: Response) => {
  try {
    const reason = await ExpenseReason.findById(req.params.id);
    if (!reason) return res.status(404).json({ success: false, error: { message: 'Expense reason not found' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: reason, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const updateExpenseReason = async (req: Request, res: Response) => {
  try {
    const reason = await ExpenseReason.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reason) return res.status(404).json({ success: false, error: { message: 'Expense reason not found' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: reason, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const deleteExpenseReason = async (req: Request, res: Response) => {
  try {
    const reason = await ExpenseReason.findByIdAndDelete(req.params.id);
    if (!reason) return res.status(404).json({ success: false, error: { message: 'Expense reason not found' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: reason, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
}; 