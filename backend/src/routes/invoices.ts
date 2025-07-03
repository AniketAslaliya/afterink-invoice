import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth';
import Invoice from '../models/Invoice';
import { IApiResponse } from '../types';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Get all invoices with pagination and filtering
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const filter = req.query.filter ? JSON.parse(req.query.filter as string) : {};
    const query: any = { ...filter };
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('clientId')
      .populate('projectId');
    
    // Remap clientId to client and projectId to project for each invoice
    const invoicesWithClient = invoices.map(invoice => {
      const obj = invoice.toObject() as Record<string, any>;
      obj.client = obj.clientId;
      obj.project = obj.projectId;
      delete obj.clientId;
      delete obj.projectId;
      return obj;
    });
    
    res.json({
      success: true,
      data: { invoices: invoicesWithClient, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch invoices', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Get specific invoice
router.get('/:id', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('clientId')
      .populate('projectId');
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
    
    // Remap clientId to client and projectId to project
    const invoiceObj = invoice.toObject() as Record<string, any>;
    invoiceObj.client = invoiceObj.clientId;
    invoiceObj.project = invoiceObj.projectId;
    delete invoiceObj.clientId;
    delete invoiceObj.projectId;
    
    res.json({
      success: true,
      data: { invoice: invoiceObj },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch invoice', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Create new invoice
router.post('/', 
  authenticate,
  [
    body('clientId').isMongoId().withMessage('Valid client ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.description').trim().notEmpty(),
    body('items.*.quantity').isFloat({ min: 0.01 }),
    body('items.*.rate').isFloat({ min: 0 }),
    body('dueDate').isISO8601().toDate(),
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
      // Generate invoice number if not provided
      let invoiceNumber = req.body.invoiceNumber;
      if (!invoiceNumber) {
        // Get the count of existing invoices to generate next number
        const invoiceCount = await Invoice.countDocuments();
        const nextNumber = (invoiceCount + 1).toString().padStart(4, '0');
        invoiceNumber = `A${nextNumber}`;
      }
      
      const now = new Date();
      const invoice = new Invoice({ ...req.body, invoiceNumber, createdBy: req.user._id, issueDate: now });
      await invoice.save();
      res.status(201).json({
        success: true,
        data: { invoice },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create invoice', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Update invoice
router.put('/:id', 
  authenticate, 
  authorizeOwnerOrAdmin(),
  [
    body('items').optional().isArray({ min: 1 }),
    body('items.*.description').optional().trim().notEmpty(),
    body('items.*.quantity').optional().isFloat({ min: 0.01 }),
    body('items.*.rate').optional().isFloat({ min: 0 }),
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
      const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: { message: 'Invoice not found' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      res.json({
        success: true,
        data: { invoice },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update invoice', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

// Delete invoice
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
    res.json({
      success: true,
      data: { message: 'Invoice deleted successfully', invoice },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete invoice', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Send invoice via email (placeholder)
router.post('/:id/send', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  // Placeholder for sending invoice via email
  res.json({
    success: true,
    data: { message: 'Invoice sent successfully (not implemented)' },
    timestamp: new Date().toISOString(),
  });
});

// Update payment status
router.post('/:id/payment', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  try {
    const { status, paymentAmount, paymentMethod, transactionId, paymentDate, paymentNotes } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }

    // Update invoice with payment information
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        status,
        paymentAmount,
        paymentMethod,
        transactionId,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentNotes,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('clientId').populate('projectId');

    if (!updatedInvoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Failed to update invoice' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }

    // Remap clientId to client and projectId to project
    const invoiceObj = updatedInvoice.toObject() as Record<string, any>;
    invoiceObj.client = invoiceObj.clientId;
    invoiceObj.project = invoiceObj.projectId;
    delete invoiceObj.clientId;
    delete invoiceObj.projectId;

    res.json({
      success: true,
      data: { invoice: invoiceObj, message: 'Payment updated successfully' },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update payment', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Generate invoice PDF (real implementation)
router.get('/:id/pdf', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
    // Create a PDF document
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Issue Date: ${invoice.issueDate}`);
    doc.text(`Due Date: ${invoice.dueDate}`);
    doc.text(`Total Amount: $${invoice.totalAmount}`);
    doc.moveDown();
    doc.fontSize(16).text('Items:');
    invoice.items.forEach((item, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${item.description} - Qty: ${item.quantity}, Rate: $${item.rate}, Amount: $${item.amount}`);
    });
    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate PDF', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

// Record payment
router.put('/:id/payment', 
  authenticate, 
  authorizeOwnerOrAdmin(),
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount is required'),
    body('paymentDate').optional().isISO8601().toDate(),
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
      const { amount, paymentDate } = req.body;
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: { message: 'Invoice not found' },
          timestamp: new Date().toISOString(),
        } as IApiResponse);
      }
      invoice.paidAmount = (invoice.paidAmount || 0) + amount;
      if (paymentDate) invoice.paymentDate = paymentDate;
      await invoice.save();
      res.json({
        success: true,
        data: { invoice, message: 'Payment recorded successfully' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to record payment', details: error },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }
  }
);

export default router; 