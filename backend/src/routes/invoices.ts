import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth';
import Invoice from '../models/Invoice';
import { IApiResponse } from '../types';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Helper function to split text to fit within a given width
function splitTextToSize(text: string, maxWidth: number, doc: PDFKit.PDFDocument): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.widthOfString(testLine);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, split it
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

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
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
    body('terms').optional().trim().isLength({ max: 1000 }).withMessage('Terms cannot exceed 1000 characters'),
    body('termsAndConditions').optional().trim().isLength({ max: 2000 }).withMessage('Terms and conditions cannot exceed 2000 characters'),
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
    body('invoiceNumber').optional().trim().notEmpty().withMessage('Invoice number cannot be empty'),
    body('items').optional().isArray({ min: 1 }),
    body('items.*.description').optional().trim().notEmpty(),
    body('items.*.quantity').optional().isFloat({ min: 0.01 }),
    body('items.*.rate').optional().isFloat({ min: 0 }),
    body('dueDate').optional().isISO8601().toDate(),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
    body('terms').optional().trim().isLength({ max: 1000 }).withMessage('Terms cannot exceed 1000 characters'),
    body('termsAndConditions').optional().trim().isLength({ max: 2000 }).withMessage('Terms and conditions cannot exceed 2000 characters'),
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

      // Check if invoice number is being updated and if it's unique
      if (req.body.invoiceNumber) {
        const existingInvoice = await Invoice.findOne({ 
          invoiceNumber: req.body.invoiceNumber,
          _id: { $ne: req.params.id } // Exclude current invoice from check
        });
        
        if (existingInvoice) {
          return res.status(400).json({
            success: false,
            error: { message: 'Invoice number already exists. Please choose a different number.' },
            timestamp: new Date().toISOString(),
          } as IApiResponse);
        }
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

// Generate invoice PDF (enhanced implementation)
router.get('/:id/pdf', authenticate, authorizeOwnerOrAdmin(), async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('clientId')
      .populate('projectId')
      .populate('createdBy');
      
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' },
        timestamp: new Date().toISOString(),
      } as IApiResponse);
    }

    // Create a PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    // Invoice details
    doc.fontSize(12).font('Helvetica');
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, { align: 'left' });
    doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, { align: 'left' });
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, { align: 'left' });
    doc.text(`Status: ${invoice.status.toUpperCase()}`, { align: 'left' });
    doc.moveDown();

    // Client information
    if (invoice.clientId) {
      const client = invoice.clientId as any;
      doc.fontSize(14).font('Helvetica-Bold').text('Bill To:', { align: 'left' });
      doc.fontSize(12).font('Helvetica');
      doc.text(client.companyName || `${client.contactPerson?.firstName} ${client.contactPerson?.lastName}`);
      if (client.contactPerson?.email) {
        doc.text(`Email: ${client.contactPerson.email}`);
      }
      if (client.address) {
        const addr = client.address;
        if (addr.street) doc.text(addr.street);
        if (addr.city || addr.state || addr.zipCode) {
          doc.text(`${addr.city || ''} ${addr.state || ''} ${addr.zipCode || ''}`.trim());
        }
        if (addr.country) doc.text(addr.country);
      }
      doc.moveDown();
    }

    // Project information
    if (invoice.projectId) {
      const project = invoice.projectId as any;
      doc.fontSize(14).font('Helvetica-Bold').text('Project:', { align: 'left' });
      doc.fontSize(12).font('Helvetica');
      doc.text(project.name);
      doc.moveDown();
    }

    // Items table
    doc.fontSize(14).font('Helvetica-Bold').text('Items:', { align: 'left' });
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 250;
    const rateX = 320;
    const amountX = 420;
    const totalX = 500;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', itemX, tableTop);
    doc.text('Qty', qtyX, tableTop);
    doc.text('Rate', rateX, tableTop);
    doc.text('Amount', amountX, tableTop);
    doc.text('Total', totalX, tableTop);

    // Table content
    let currentY = tableTop + 20;
    doc.fontSize(10).font('Helvetica');
    
    invoice.items.forEach((item, index) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const itemTotal = (item.quantity * item.rate) + ((item.quantity * item.rate) * (item.taxRate || 0) / 100);
      
      doc.text(item.description, itemX, currentY);
      doc.text(item.quantity.toString(), qtyX, currentY);
      doc.text(`$${item.rate.toFixed(2)}`, rateX, currentY);
      doc.text(`$${(item.quantity * item.rate).toFixed(2)}`, amountX, currentY);
      doc.text(`$${itemTotal.toFixed(2)}`, totalX, currentY);

      if (item.note) {
        currentY += 15;
        doc.fontSize(8).font('Helvetica-Oblique');
        doc.text(`Note: ${item.note}`, itemX + 10, currentY);
        doc.fontSize(10).font('Helvetica');
      }

      currentY += 20;
    });

    // Totals
    currentY += 10;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Subtotal:', totalX - 80, currentY);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, totalX, currentY);
    
    if (invoice.taxAmount > 0) {
      currentY += 20;
      doc.text('Tax:', totalX - 80, currentY);
      doc.text(`$${invoice.taxAmount.toFixed(2)}`, totalX, currentY);
    }

    if (invoice.discountAmount > 0) {
      currentY += 20;
      doc.text('Discount:', totalX - 80, currentY);
      doc.text(`-$${invoice.discountAmount.toFixed(2)}`, totalX, currentY);
    }

    currentY += 20;
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('Total:', totalX - 80, currentY);
    doc.text(`$${invoice.totalAmount.toFixed(2)}`, totalX, currentY);

    // Payment information
    if (invoice.paidAmount > 0) {
      currentY += 20;
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Paid Amount:', totalX - 80, currentY);
      doc.text(`$${invoice.paidAmount.toFixed(2)}`, totalX, currentY);
      
      if (invoice.paymentDate) {
        currentY += 20;
        doc.text('Payment Date:', totalX - 80, currentY);
        doc.text(new Date(invoice.paymentDate).toLocaleDateString(), totalX, currentY);
      }
    }

    // Notes
    if (invoice.notes) {
      currentY += 30;
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      doc.fontSize(12).font('Helvetica-Bold').text('Notes:', 50, currentY);
      currentY += 15;
      doc.fontSize(10).font('Helvetica');
      const notesLines = splitTextToSize(invoice.notes, 450, doc);
      notesLines.forEach((line: string) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        doc.text(line, 50, currentY);
        currentY += 15;
      });
    }

    // Terms
    if (invoice.terms) {
      currentY += 20;
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      doc.fontSize(12).font('Helvetica-Bold').text('Payment Terms:', 50, currentY);
      currentY += 15;
      doc.fontSize(10).font('Helvetica');
      const termsLines = splitTextToSize(invoice.terms, 450, doc);
      termsLines.forEach((line: string) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        doc.text(line, 50, currentY);
        currentY += 15;
      });
    }

    // Terms and Conditions
    if (invoice.termsAndConditions) {
      currentY += 20;
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      doc.fontSize(12).font('Helvetica-Bold').text('Terms & Conditions:', 50, currentY);
      currentY += 15;
      doc.fontSize(10).font('Helvetica');
      const tcLines = splitTextToSize(invoice.termsAndConditions, 450, doc);
      tcLines.forEach((line: string) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        doc.text(line, 50, currentY);
        currentY += 15;
      });
    }

    // Footer
    doc.fontSize(10).font('Helvetica-Oblique');
    doc.text('Thank you for your business!', { align: 'center' });

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

// Get next invoice number
router.get('/next-number', authenticate, async (req: Request, res: Response) => {
  try {
    const invoiceNumber = await Invoice.generateInvoiceNumber();
    res.json({
      success: true,
      data: { invoiceNumber },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate invoice number', details: error },
      timestamp: new Date().toISOString(),
    } as IApiResponse);
  }
});

export default router; 