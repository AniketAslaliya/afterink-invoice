import { Request, Response } from 'express';
import Expense from '../models/Expense';

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { reasonId, amount, date, description } = req.body;
    const createdBy = req.user?._id;
    const expense = await Expense.create({ reasonId, amount, date, description, createdBy });
    res.status(201).json({ success: true, data: expense, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { reasonId } = req.query;
    const filter: any = {};
    if (reasonId) filter.reasonId = reasonId;
    const expenses = await Expense.find(filter).populate('reasonId').sort({ date: -1 });
    res.json({ success: true, data: expenses, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('reasonId');
    if (!expense) return res.status(404).json({ success: false, error: { message: 'Expense not found' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: expense, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ success: false, error: { message: 'Expense not found' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: expense, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: { message: 'Expense not found' }, timestamp: new Date().toISOString() });
    res.json({ success: true, data: expense, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message }, timestamp: new Date().toISOString() });
  }
}; 