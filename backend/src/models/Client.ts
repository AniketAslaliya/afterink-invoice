import mongoose, { Schema, Document } from 'mongoose';
import { IClient } from '../types';

interface IClientDocument extends IClient, Document {}

const clientSchema = new Schema<IClientDocument>({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxLength: [100, 'Company name cannot exceed 100 characters'],
  },
  contactPerson: {
    firstName: {
      type: String,
      required: [true, 'Contact person first name is required'],
      trim: true,
      maxLength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Contact person last name is required'],
      trim: true,
      maxLength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Contact person email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Contact person phone is required'],
      trim: true,
    },
    position: {
      type: String,
      trim: true,
      maxLength: [100, 'Position cannot exceed 100 characters'],
    },
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'United States',
    },
  },
  billingAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  paymentTerms: {
    type: Number,
    required: [true, 'Payment terms are required'],
    min: [1, 'Payment terms must be at least 1 day'],
    max: [365, 'Payment terms cannot exceed 365 days'],
    default: 30,
  },
  taxNumber: {
    type: String,
    trim: true,
    sparse: true, // Allow multiple null values
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: [50, 'Tag cannot exceed 50 characters'],
  }],
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Status must be either active or inactive',
    },
    default: 'active',
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

// Indexes for faster queries
clientSchema.index({ companyName: 1 });
clientSchema.index({ 'contactPerson.email': 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ createdBy: 1 });
clientSchema.index({ tags: 1 });
clientSchema.index({ createdAt: -1 });

// Virtual for full contact name
clientSchema.virtual('contactPerson.fullName').get(function(this: any) {
  return `${this.contactPerson?.firstName || ''} ${this.contactPerson?.lastName || ''}`.trim();
});

// Virtual for complete address
clientSchema.virtual('address.full').get(function(this: any) {
  const addr = this.address || {};
  return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}, ${addr.country || ''}`.replace(/, +/g, ', ').replace(/, $/, '');
});

// Pre-save middleware to handle billing address
clientSchema.pre('save', function(this: any, next) {
  if (!this.billingAddress || Object.keys(this.billingAddress).every((key: string) => !this.billingAddress[key])) {
    this.billingAddress = { ...this.address };
  }
  next();
});

export default mongoose.model<IClientDocument>('Client', clientSchema); 