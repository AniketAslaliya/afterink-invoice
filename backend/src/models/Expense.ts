import mongoose, { Schema, Document } from 'mongoose';
import { IExpense } from '../types';

interface IExpenseDocument extends IExpense, Document {}

const expenseSchema = new Schema<IExpenseDocument>({
  reasonId: {
    type: Schema.Types.ObjectId,
    ref: 'ExpenseReason',
    required: [true, 'Expense reason is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be non-negative'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required'],
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

expenseSchema.index({ reasonId: 1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ date: -1 });

export default mongoose.model<IExpenseDocument>('Expense', expenseSchema); 