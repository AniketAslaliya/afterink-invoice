import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth';
import Client from '../models/Client';
import Invoice from '../models/Invoice';
import Project from '../models/Project';
import { IApiResponse } from '../types';
import { Request, Response } from 'express';

const router = express.Router();

// Get all clients with pagination and filtering
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const filter = req.query.filter ? JSON.parse(req.query.filter as string) : {};
    const query: any = { ...filter };
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { 'contactPerson.firstName': { $regex: search, $options: 'i' } },
        { 'contactPerson.lastName': { $regex: search, $options: 'i' } },
        { 'contactPerson.email': { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: { clients, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch clients', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Get specific client
router.get('/:id', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
    res.json({
      success: true,
      data: { client },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch client', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Create new client
router.post('/', 
  authenticate,
  [
    body('companyName').trim().notEmpty().isLength({ max: 100 }),
    body('contactPerson.firstName').trim().notEmpty().isLength({ max: 50 }),
    body('contactPerson.lastName').trim().notEmpty().isLength({ max: 50 }),
    body('contactPerson.email').isEmail().normalizeEmail(),
    body('contactPerson.phone').trim().notEmpty(),
    body('address.street').optional().trim(),
    body('address.city').optional().trim(),
    body('address.state').optional().trim(),
    body('address.zipCode').optional().trim(),
    body('paymentTerms').optional().isInt({ min: 1, max: 365 }),
  ],
  async (req: Request, res: Response) => {
    try {
      console.log('MongoDB server received client data:', req.body);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      
      // Prepare client data with defaults for optional fields
      const clientData = {
        ...req.body,
        createdBy: req.user._id,
        address: {
          street: req.body.address?.street || '123 Main St',
          city: req.body.address?.city || 'City',
          state: req.body.address?.state || 'State',
          zipCode: req.body.address?.zipCode || '12345',
          country: req.body.address?.country || 'United States'
        },
        paymentTerms: req.body.paymentTerms || 30,
        status: req.body.status || 'active'
      };
      
      console.log('Creating client with data:', clientData);
      
      const client = new Client(clientData);
      const savedClient = await client.save();
      
      console.log('MongoDB server created client:', savedClient);
      
      res.status(201).json({
        success: true,
        data: { client: savedClient },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error: any) {
      console.error('MongoDB server error creating client:', error);
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: { 
            message: 'Validation failed', 
            details: Object.values(error.errors).map((err: any) => ({
              field: err.path,
              message: err.message
            }))
          },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create client', details: error.message },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Update client
router.put('/:id', 
  authenticate, 
  authorizeOwnerOrAdmin(),
  [
    body('companyName').optional().trim().isLength({ max: 100 }),
    body('contactPerson.firstName').optional().trim().isLength({ max: 50 }),
    body('contactPerson.lastName').optional().trim().isLength({ max: 50 }),
    body('contactPerson.email').optional().isEmail().normalizeEmail(),
    body('paymentTerms').optional().isInt({ min: 1, max: 365 }),
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
      const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!client) {
        return res.status(404).json({
          success: false,
          error: { message: 'Client not found' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      res.json({
        success: true,
        data: { client },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update client', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Delete client (soft delete)
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
    res.json({
      success: true,
      data: { message: 'Client deactivated successfully', client },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to deactivate client', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Get client's invoices
router.get('/:id/invoices', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find({ clientId: req.params.id });
    res.json({
      success: true,
      data: { invoices },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch client invoices', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Get client's projects
router.get('/:id/projects', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  try {
    const projects = await Project.find({ clientId: req.params.id });
    res.json({
      success: true,
      data: { projects },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch client projects', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

export default router; 