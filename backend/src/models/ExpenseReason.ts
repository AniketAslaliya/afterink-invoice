import mongoose, { Schema, Document } from 'mongoose';
import { IExpenseReason } from '../types';

interface IExpenseReasonDocument extends IExpenseReason, Document {}

const expenseReasonSchema = new Schema<IExpenseReasonDocument>({
  name: {
    type: String,
    required: [true, 'Reason name is required'],
    trim: true,
    unique: true,
    maxLength: [100, 'Reason name cannot exceed 100 characters'],
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

expenseReasonSchema.index({ name: 1 });
expenseReasonSchema.index({ createdBy: 1 });

export default mongoose.model<IExpenseReasonDocument>('ExpenseReason', expenseReasonSchema); 