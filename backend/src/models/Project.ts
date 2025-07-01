import mongoose, { Schema, Document } from 'mongoose';
import { IProject, ITask, IProjectFile } from '../types';

interface IProjectDocument extends IProject, Document {}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxLength: [200, 'Task title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxLength: [1000, 'Task description cannot exceed 1000 characters'],
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user'],
  },
  status: {
    type: String,
    enum: {
      values: ['todo', 'in-progress', 'review', 'completed'],
      message: 'Status must be one of: todo, in-progress, review, completed',
    },
    default: 'todo',
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent',
    },
    default: 'medium',
  },
  dueDate: {
    type: Date,
    default: null,
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent must be non-negative'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const projectFileSchema = new Schema<IProjectFile>({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true,
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
  },
  path: {
    type: String,
    required: [true, 'File path is required'],
    trim: true,
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size must be non-negative'],
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploaded by user is required'],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const projectSchema = new Schema<IProjectDocument>({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxLength: [200, 'Project name cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxLength: [2000, 'Project description cannot exceed 2000 characters'],
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required'],
  },
  category: {
    type: String,
    required: [true, 'Project category is required'],
    enum: {
      values: [
        'Web Design',
        'Web Development',
        'Mobile App',
        'Branding',
        'Logo Design',
        'Marketing',
        'SEO',
        'Content Creation',
        'Consulting',
        'Other'
      ],
      message: 'Invalid project category',
    },
  },
  status: {
    type: String,
    enum: {
      values: ['planning', 'active', 'review', 'completed', 'cancelled'],
      message: 'Status must be one of: planning, active, review, completed, cancelled',
    },
    default: 'planning',
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: null,
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget must be non-negative'],
  },
  actualCost: {
    type: Number,
    default: 0,
    min: [0, 'Actual cost must be non-negative'],
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  tasks: [taskSchema],
  files: [projectFileSchema],
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
projectSchema.index({ name: 1 });
projectSchema.index({ clientId: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ assignedTo: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ startDate: -1 });
projectSchema.index({ createdAt: -1 });

// Virtual for project progress
projectSchema.virtual('progress').get(function() {
  if (!this.tasks || this.tasks.length === 0) return 0;
  const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
  return Math.round((completedTasks / this.tasks.length) * 100);
});

// Virtual for total time spent
projectSchema.virtual('totalTimeSpent').get(function() {
  if (!this.tasks || this.tasks.length === 0) return 0;
  return this.tasks.reduce((total, task) => total + (task.timeSpent || 0), 0);
});

// Virtual for overdue tasks
projectSchema.virtual('overdueTasks').get(function() {
  if (!this.tasks || this.tasks.length === 0) return [];
  const today = new Date();
  return this.tasks.filter(task => 
    task.dueDate && 
    new Date(task.dueDate) < today && 
    task.status !== 'completed'
  );
});

// Virtual for budget utilization
projectSchema.virtual('budgetUtilization').get(function() {
  if (this.budget === 0) return 0;
  return Math.round((this.actualCost / this.budget) * 100);
});

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  const start = new Date(this.startDate);
  const end = this.endDate ? new Date(this.endDate) : new Date();
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update project status based on tasks
projectSchema.pre('save', function(next) {
  if (this.tasks && this.tasks.length > 0) {
    const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
    const totalTasks = this.tasks.length;
    
    // Auto-update status based on task completion
    if (completedTasks === totalTasks && this.status === 'active') {
      this.status = 'review';
    } else if (completedTasks > 0 && this.status === 'planning') {
      this.status = 'active';
    }
  }
  
  // Set end date when project is completed
  if (this.status === 'completed' && !this.endDate) {
    this.endDate = new Date();
  }
  
  next();
});

// Static method to get project statistics
projectSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' },
        totalActualCost: { $sum: '$actualCost' },
      },
    },
  ]);
  
  const totalProjects = await this.countDocuments();
  
  return {
    totalProjects,
    byStatus: stats,
    totalBudget: stats.reduce((sum, stat) => sum + stat.totalBudget, 0),
    totalActualCost: stats.reduce((sum, stat) => sum + stat.totalActualCost, 0),
  };
};

// Instance method to add task
projectSchema.methods.addTask = function(taskData: Partial<ITask>) {
  this.tasks.push(taskData);
  return this.save();
};

// Instance method to update task status
projectSchema.methods.updateTaskStatus = function(taskId: string, status: string) {
  const task = this.tasks.id(taskId);
  if (task) {
    task.status = status;
    return this.save();
  }
  throw new Error('Task not found');
};

export default mongoose.model<IProjectDocument>('Project', projectSchema); 