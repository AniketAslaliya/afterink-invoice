import { Types } from 'mongoose';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IClient {
  companyName: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentTerms: number; // Days
  taxNumber?: string;
  notes?: string;
  tags: string[];
  status: 'active' | 'inactive';
  customClientId: string;
  createdBy: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate: number;
  note?: string;
}

export interface IInvoice {
  invoiceNumber: string;
  clientId: Types.ObjectId | string;
  projectId?: Types.ObjectId | string;
  issueDate: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount: number;
  paymentAmount?: number;
  paymentDate?: Date;
  paymentMethod?: 'bank_transfer' | 'upi' | 'paypal' | 'card' | 'cheque' | 'cash';
  transactionId?: string;
  paymentNotes?: string;
  notes?: string;
  terms?: string;
  termsAndConditions?: string;
  createdBy: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITask {
  title: string;
  description: string;
  assignedTo: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  timeSpent: number;
  createdAt?: Date;
}

export interface IProjectFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  uploadedBy: string;
  uploadedAt?: Date;
}

export interface IProject {
  name: string;
  description: string;
  clientId: string;
  category: string;
  status: 'planning' | 'active' | 'review' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  budget: number;
  actualCost: number;
  assignedTo: string[];
  tasks: ITask[];
  files: IProjectFile[];
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'admin' | 'manager' | 'employee';
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: string;
  search?: string;
}

export interface IEmailTemplate {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export interface IBonus {
  clientId: Types.ObjectId | string;
  amount: number;
  date: Date;
  description?: string;
  category?: string;
  createdBy: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExpense {
  reasonId: Types.ObjectId | string;
  amount: number;
  date: Date;
  description?: string;
  createdBy: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExpenseReason {
  name: string;
  description?: string;
  createdBy: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
} 