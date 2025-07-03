import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth';
import Project from '../models/Project';
import { IApiResponse } from '../types';

const router = express.Router();

// Get all projects with pagination and filtering
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const filter = req.query.filter ? JSON.parse(req.query.filter as string) : {};
    const query: any = { ...filter };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('clientId');
    // Remap clientId to client for each project
    const projectsWithClient = projects.map(project => {
      const obj = project.toObject() as Record<string, any>;
      obj.client = obj.clientId;
      delete obj.clientId;
      return obj;
    });
    res.json({
      success: true,
      data: { projects: projectsWithClient, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch projects', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Get specific project
router.get('/:id', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
    res.json({
      success: true,
      data: { project },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch project', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Create new project
router.post('/', 
  authenticate,
  [
    body('name').trim().notEmpty().isLength({ max: 200 }),
    body('clientId').isMongoId().withMessage('Valid client ID is required'),
    body('category').isIn(['Web Design', 'Web Development', 'Mobile App', 'Branding', 'Logo Design', 'Marketing', 'SEO', 'Content Creation', 'Consulting', 'Other']),
    body('budget').isFloat({ min: 0 }),
    body('startDate').isISO8601().toDate(),
  ],
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      const project = new Project({ ...req.body, createdBy: req.user._id });
      await project.save();
      res.status(201).json({
        success: true,
        data: { project },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create project', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Update project
router.put('/:id', 
  authenticate, 
  authorizeOwnerOrAdmin(),
  [
    body('name').optional().trim().isLength({ max: 200 }),
    body('budget').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['planning', 'active', 'review', 'completed', 'cancelled']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      res.json({
        success: true,
        data: { project },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update project', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Delete project
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
    res.json({
      success: true,
      data: { message: 'Project deleted successfully', project },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete project', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Add task to project
router.post('/:id/tasks', 
  authenticate, 
  authorizeOwnerOrAdmin(),
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('assignedTo').isMongoId().withMessage('Valid user ID is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('dueDate').optional().isISO8601().toDate(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      project.tasks.push({ ...req.body, createdAt: new Date() });
      await project.save();
      res.status(201).json({
        success: true,
        data: { project, message: 'Task added successfully' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to add task', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Update task in project
router.put('/:id/tasks/:taskId', 
  authenticate, 
  authorizeOwnerOrAdmin(),
  [
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'completed']),
    body('timeSpent').optional().isFloat({ min: 0 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      const task = (project.tasks as any).id(req.params.taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: { message: 'Task not found' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      Object.assign(task, req.body);
      await project.save();
      res.json({
        success: true,
        data: { project, message: 'Task updated successfully' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update task', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Upload files to project (placeholder)
router.post('/:id/files', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  // Placeholder for file upload logic
  res.json({
    success: true,
    data: { message: 'Files uploaded successfully (not implemented)' },
    timestamp: new Date().toISOString(),
  });
});

export default router; 