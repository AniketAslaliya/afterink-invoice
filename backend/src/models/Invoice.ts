import mongoose, { Schema, Document, Types } from 'mongoose';
import { IInvoice, IInvoiceItem } from '../types';

interface IInvoiceDocument extends IInvoice, Document {
  clientId: Types.ObjectId;
  projectId?: Types.ObjectId;
  createdBy: Types.ObjectId;
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
  },
  rate: {
    type: Number,
    required: [true, 'Rate is required'],
    min: [0, 'Rate must be non-negative'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be non-negative'],
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate must be non-negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
  },
}, { _id: false });

const invoiceSchema = new Schema<IInvoiceDocument>({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required'],
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required'],
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  items: {
    type: [invoiceItemSchema],
    required: [true, 'At least one item is required'],
    validate: {
      validator: function(items: IInvoiceItem[]) {
        return items && items.length > 0;
      },
      message: 'Invoice must contain at least one item',
    },
  },
  subtotal: {
    type: Number,
    default: 0,
    min: [0, 'Subtotal must be non-negative'],
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount must be non-negative'],
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount must be non-negative'],
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount must be non-negative'],
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: {
      values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'],
      message: 'Currency must be one of: USD, EUR, GBP, CAD, AUD, INR',
    },
    default: 'INR',
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      message: 'Status must be one of: draft, sent, paid, overdue, cancelled',
    },
    default: 'draft',
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['unpaid', 'partial', 'paid'],
      message: 'Payment status must be one of: unpaid, partial, paid',
    },
    default: 'unpaid',
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount must be non-negative'],
  },
  paymentDate: {
    type: Date,
    default: null,
  },
  paymentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Payment amount must be non-negative'],
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'paypal', 'card', 'cheque', 'cash'],
    default: null,
  },
  transactionId: {
    type: String,
    trim: true,
    default: null,
  },
  paymentNotes: {
    type: String,
    trim: true,
    maxLength: [500, 'Payment notes cannot exceed 500 characters'],
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  terms: {
    type: String,
    trim: true,
    maxLength: [1000, 'Terms cannot exceed 1000 characters'],
    default: 'Payment is due within 30 days of invoice date.',
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

// Indexes for faster queries (invoiceNumber already has unique index from schema)
invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ projectId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ createdBy: 1 });
invoiceSchema.index({ createdAt: -1 });

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function(this: any) {
  if (this.status === 'paid' || this.status === 'cancelled') return 0;
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  if (today > dueDate) {
    return Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for remaining amount
invoiceSchema.virtual('remainingAmount').get(function(this: any) {
  return (this.totalAmount || 0) - (this.paidAmount || 0);
});

// Pre-save middleware to calculate totals
invoiceSchema.pre('save', function(this: any, next) {
  // Calculate subtotal
  this.subtotal = (this.items || []).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  
  // Calculate tax amount
  this.taxAmount = (this.items || []).reduce((sum: number, item: any) => {
    return sum + ((item.amount || 0) * (item.taxRate || 0) / 100);
  }, 0);
  
  // Calculate total amount
  this.totalAmount = (this.subtotal || 0) + (this.taxAmount || 0) - (this.discountAmount || 0);
  
  // Update payment status based on paid amount
  if ((this.paidAmount || 0) >= (this.totalAmount || 0)) {
    this.paymentStatus = 'paid';
    this.status = 'paid';
    if (!this.paymentDate) {
      this.paymentDate = new Date();
    }
  } else if ((this.paidAmount || 0) > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'unpaid';
  }
  
  // Check if invoice is overdue
  if (this.status === 'sent' && this.paymentStatus !== 'paid' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  
  next();
});

// Static method to generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function(): Promise<string> {
  const prefix = 'a';
  // Find the latest invoice number with this prefix
  const latestInvoice = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}` },
  }).sort({ invoiceNumber: -1 });

  let nextNumber = 1;
  if (latestInvoice) {
    const currentNumber = parseInt(latestInvoice.invoiceNumber.replace(prefix, ''), 10);
    nextNumber = currentNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
};

export default mongoose.model<IInvoiceDocument>('Invoice', invoiceSchema); 