import mongoose, { Schema, Document } from 'mongoose';
import { IBonus } from '../types';

interface IBonusDocument extends IBonus, Document {}

const bonusSchema = new Schema<IBonusDocument>({
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required'],
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
  category: {
    type: String,
    trim: true,
    maxLength: [100, 'Category cannot exceed 100 characters'],
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

bonusSchema.index({ clientId: 1 });
bonusSchema.index({ createdBy: 1 });
bonusSchema.index({ date: -1 });

export default mongoose.model<IBonusDocument>('Bonus', bonusSchema); 