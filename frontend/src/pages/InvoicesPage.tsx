import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Trash2, Download, Palette, Save } from 'lucide-react';
import { apiGet, apiPost } from '../api';

// Type for Invoice
interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  status: string;
  totalAmount: number; // Fixed to match backend field name
  dueDate: string;
  client?: Client;
  project?: Project;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number;
}

interface Client {
  _id: string;
  companyName: string;
  contactPerson: { firstName: string; lastName: string; email: string };
}

interface Project {
  _id: string;
  name: string;
  clientId: string;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

interface InvoiceCustomization {
  template: string;
  companyLogo?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  showLogo: boolean;
  showCompanyDetails: boolean;
  footerText: string;
  currency: string;
}

const defaultTemplates: InvoiceTemplate[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, minimalist design with subtle colors',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      text: '#1e293b',
      background: '#ffffff',
      accent: '#f1f5f9'
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    }
  },
  {
    id: 'professional-corporate',
    name: 'Professional Corporate',
    description: 'Traditional business style with strong branding',
    colors: {
      primary: '#1f2937',
      secondary: '#374151',
      text: '#111827',
      background: '#ffffff',
      accent: '#f9fafb'
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Arial, sans-serif'
    }
  },
  {
    id: 'creative-modern',
    name: 'Creative Modern',
    description: 'Vibrant and creative with modern typography',
    colors: {
      primary: '#7c3aed',
      secondary: '#a855f7',
      text: '#1f2937',
      background: '#ffffff',
      accent: '#faf5ff'
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Roboto, sans-serif'
    }
  }
];

const defaultCustomization: InvoiceCustomization = {
  template: 'modern-minimal',
  companyName: 'Afterink Studio',
  companyAddress: '123 Business Street, Suite 100, City, State 12345',
  companyPhone: '+1 (555) 123-4567',
  companyEmail: 'hello@afterink.com',
  companyWebsite: 'www.afterink.com',
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    text: '#1e293b',
    background: '#ffffff',
    accent: '#f1f5f9'
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif'
  },
  showLogo: false,
  showCompanyDetails: true,
  footerText: 'Thank you for choosing our services!',
  currency: 'USD'
};

/**
 * InvoicesPage - Displays a list of invoices fetched from the backend.
 * Allows searching, filtering, and adding new invoices.
 */
const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    projectId: '',
    dueDate: '',
    items: [{
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      taxRate: 0
    }] as InvoiceItem[],
    currency: 'USD',
    notes: '',
    terms: 'Payment is due within 30 days of invoice date.'
  });
  
  // Template customization states
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [invoiceCustomization, setInvoiceCustomization] = useState<InvoiceCustomization>(() => {
    const saved = localStorage.getItem('invoiceCustomization');
    return saved ? JSON.parse(saved) : defaultCustomization;
  });


  // Fetch invoices from backend on mount
  useEffect(() => {
    fetchInvoices()
    fetchClients()
    fetchProjects()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const res = await apiGet('/invoices')
      setInvoices(res.data.invoices || [])
      setError(null)
    } catch (err: any) {
      console.error('Fetch invoices error:', err)
      // Check if it's an authentication error
      if (err.message.includes('Access token') || err.message.includes('Failed to fetch') || err.message.includes('401')) {
        setError('authentication')
      } else {
        setError(err.message)
      }
      setInvoices([]) // Set empty array so we can show "no invoices" message
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      console.log('Fetching clients from API...')
      const res = await apiGet('/clients')
      console.log('Clients API Response:', res)
      
      // Handle different response structures
      let clientsArray = [];
      if (res && res.data && res.data.clients) {
        clientsArray = res.data.clients;
      } else if (res && Array.isArray(res.clients)) {
        clientsArray = res.clients;
      } else if (res && Array.isArray(res)) {
        clientsArray = res;
      } else {
        console.warn('Unexpected clients response structure:', res);
        clientsArray = []; // Default to empty array
      }
      
      setClients(clientsArray)
    } catch (err: any) {
      console.error('Error fetching clients:', err.message)
    }
  }

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects from API...')
      const res = await apiGet('/projects')
      console.log('Projects API Response:', res)
      
      // Handle different response structures
      let projectsArray = [];
      if (res && res.data && res.data.projects) {
        projectsArray = res.data.projects;
      } else if (res && Array.isArray(res.projects)) {
        projectsArray = res.projects;
      } else if (res && Array.isArray(res)) {
        projectsArray = res;
      } else {
        console.warn('Unexpected projects response structure:', res);
        projectsArray = []; // Default to empty array
      }
      
      setProjects(projectsArray)
    } catch (err: any) {
      console.error('Error fetching projects:', err.message)
    }
  }

  const handleAddInvoice = async () => {
    try {
      setSubmitting(true)
      
      // Calculate totals before sending
      const subtotal = newInvoice.items.reduce((sum, item) => sum + item.amount, 0)
      const taxAmount = newInvoice.items.reduce((sum, item) => {
        const itemTax = item.amount * (item.taxRate || 0) / 100
        return sum + itemTax
      }, 0)
      const totalAmount = subtotal + taxAmount
      
      const invoiceData = {
        ...newInvoice,
        projectId: newInvoice.projectId || undefined,
        subtotal: subtotal,
        taxAmount: taxAmount,
        totalAmount: totalAmount
      }
      
      console.log('Sending invoice data:', invoiceData)
      const res = await apiPost('/invoices', invoiceData)
      console.log('Invoice API Response:', res)
      
      // Handle the API response more flexibly
      let invoiceObject;
      if (res && res.data && res.data.invoice) {
        invoiceObject = res.data.invoice;
      } else if (res && res.invoice) {
        invoiceObject = res.invoice;
      } else if (res && res._id) {
        // Sometimes the response might be the invoice object directly
        invoiceObject = res;
      } else {
        console.error('Unexpected invoice response structure:', res);
        throw new Error('Unexpected API response structure. Check console for details.');
      }
      
      setInvoices([invoiceObject, ...invoices])
      setShowAddModal(false)
      // Reset form
      setNewInvoice({
        clientId: '',
        projectId: '',
        dueDate: '',
        items: [{
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0,
          taxRate: 0
        }],
        currency: 'USD',
        notes: '',
        terms: 'Payment is due within 30 days of invoice date.'
      })
      
      console.log('Invoice created successfully!')
    } catch (err: any) {
      console.error('Error creating invoice:', err)
      alert('Error creating invoice: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, {
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
        taxRate: 0
      }]
    })
  }

  const removeItem = (index: number) => {
    const items = newInvoice.items.filter((_, i) => i !== index)
    setNewInvoice({ ...newInvoice, items })
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...newInvoice.items]
    items[index] = { ...items[index], [field]: value }
    
    // Calculate amount when quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      items[index].amount = items[index].quantity * items[index].rate
    }
    
    setNewInvoice({ ...newInvoice, items })
  }

  const calculateTotal = () => {
    return newInvoice.items.reduce((total, item) => total + item.amount, 0)
  }

  const getFilteredProjects = () => {
    return projects.filter(project => project.clientId === newInvoice.clientId)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoiceCustomization.currency
    }).format(amount);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    
    // Create a printable invoice view with custom styling
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Georgia:wght@400;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: ${invoiceCustomization.fonts.body}; 
              margin: 40px; 
              color: ${invoiceCustomization.colors.text}; 
              background-color: ${invoiceCustomization.colors.background};
              line-height: 1.6;
            }
            .header { 
              border-bottom: 3px solid ${invoiceCustomization.colors.primary};
              padding-bottom: 30px;
              margin-bottom: 40px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .company-info {
              flex: 1;
            }
            .company-logo {
              height: 80px;
              width: auto;
              margin-bottom: 20px;
            }
            .company-name { 
              font-family: ${invoiceCustomization.fonts.heading};
              font-size: 32px; 
              font-weight: bold;
              color: ${invoiceCustomization.colors.primary}; 
              margin-bottom: 10px;
            }
            .company-details {
              color: ${invoiceCustomization.colors.secondary};
              font-size: 14px;
              line-height: 1.5;
            }
            .invoice-title-section {
              text-align: right;
              flex: 1;
            }
            .invoice-title { 
              font-family: ${invoiceCustomization.fonts.heading};
              font-size: 36px; 
              font-weight: bold; 
              color: ${invoiceCustomization.colors.primary}; 
              margin-bottom: 20px;
            }
            .invoice-meta {
              background-color: ${invoiceCustomization.colors.accent};
              padding: 20px;
              border-radius: 8px;
              font-size: 14px;
            }
            .invoice-meta p {
              margin-bottom: 8px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
              margin-top: 8px;
            }
            .status-paid { background-color: #10b981; color: white; }
            .status-pending { background-color: #f59e0b; color: white; }
            .status-overdue { background-color: #ef4444; color: white; }
            .bill-to {
              margin-bottom: 40px;
              background-color: ${invoiceCustomization.colors.accent};
              padding: 25px;
              border-radius: 8px;
              border-left: 4px solid ${invoiceCustomization.colors.primary};
            }
            .bill-to h3 {
              font-family: ${invoiceCustomization.fonts.heading};
              color: ${invoiceCustomization.colors.primary};
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .bill-to .client-name {
              font-size: 18px;
              font-weight: 600;
              color: ${invoiceCustomization.colors.text};
              margin-bottom: 5px;
            }
            .invoice-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .invoice-table th { 
              background-color: ${invoiceCustomization.colors.primary}; 
              color: white;
              padding: 15px; 
              text-align: left; 
              font-weight: 600;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .invoice-table td { 
              padding: 15px; 
              border-bottom: 1px solid #e5e7eb;
              background-color: white;
            }
            .invoice-table tbody tr:hover {
              background-color: ${invoiceCustomization.colors.accent};
            }
            .total-section { 
              margin-top: 40px;
              display: flex;
              justify-content: flex-end;
            }
            .total-box {
              background-color: ${invoiceCustomization.colors.accent};
              padding: 25px;
              border-radius: 8px;
              min-width: 300px;
              border: 2px solid ${invoiceCustomization.colors.primary};
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 12px;
              padding: 8px 0;
            }
            .total-row.subtotal {
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 12px;
            }
            .total-row.final { 
              font-size: 20px; 
              font-weight: bold; 
              color: ${invoiceCustomization.colors.primary};
              border-top: 2px solid ${invoiceCustomization.colors.primary};
              padding-top: 15px;
              margin-top: 15px;
            }
            .footer {
              margin-top: 50px; 
              padding-top: 30px; 
              border-top: 2px solid ${invoiceCustomization.colors.accent};
              text-align: center;
            }
            .footer-text {
              color: ${invoiceCustomization.colors.secondary};
              font-size: 14px;
              margin-bottom: 15px;
            }
            .footer-company {
              color: ${invoiceCustomization.colors.primary};
              font-weight: 600;
              font-size: 16px;
            }
            @media print { 
              body { margin: 20px; } 
              .invoice-table { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              ${invoiceCustomization.companyLogo && invoiceCustomization.showLogo ? 
                `<img src="${invoiceCustomization.companyLogo}" alt="Company Logo" class="company-logo" />` : ''}
              <div class="company-name">${invoiceCustomization.companyName}</div>
              ${invoiceCustomization.showCompanyDetails ? `
                <div class="company-details">
                  <div>${invoiceCustomization.companyAddress}</div>
                  <div>${invoiceCustomization.companyPhone} • ${invoiceCustomization.companyEmail}</div>
                  ${invoiceCustomization.companyWebsite ? `<div>${invoiceCustomization.companyWebsite}</div>` : ''}
                </div>` : ''}
            </div>
            
            <div class="invoice-title-section">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-meta">
                <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                <div class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</div>
              </div>
            </div>
          </div>
          
          <div class="bill-to">
            <h3>Bill To</h3>
            <div class="client-name">${invoice.client?.companyName || 'N/A'}</div>
            <div>${invoice.client?.contactPerson?.firstName || ''} ${invoice.client?.contactPerson?.lastName || ''}</div>
            <div style="color: ${invoiceCustomization.colors.secondary};">${invoice.client?.contactPerson?.email || 'N/A'}</div>
            ${invoice.project ? `<div style="margin-top: 10px;"><strong>Project:</strong> ${invoice.project.name}</div>` : ''}
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th style="width: 50%;">Description</th>
                <th style="width: 15%; text-align: center;">Qty</th>
                <th style="width: 20%; text-align: right;">Rate</th>
                <th style="width: 15%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Professional Services</td>
                <td style="text-align: center;">1</td>
                <td style="text-align: right;">${formatCurrency(invoice.totalAmount || 0)}</td>
                <td style="text-align: right; font-weight: 600;">${formatCurrency(invoice.totalAmount || 0)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-box">
              <div class="total-row subtotal">
                <span>Subtotal:</span>
                <span>${formatCurrency(invoice.totalAmount || 0)}</span>
              </div>
              <div class="total-row">
                <span>Tax:</span>
                <span>${formatCurrency(0)}</span>
              </div>
              <div class="total-row final">
                <span>Total:</span>
                <span>${formatCurrency(invoice.totalAmount || 0)}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">${invoiceCustomization.footerText}</div>
            <div class="footer-company">${invoiceCustomization.companyName}</div>
          </div>
        </body>
      </html>
    `;
    
    // Open in new window for printing/saving
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 100);
    }
  }

  const handleSaveCustomization = (customization: InvoiceCustomization) => {
    setInvoiceCustomization(customization);
    localStorage.setItem('invoiceCustomization', JSON.stringify(customization));
    setShowCustomizer(false);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-secondary-200/60 to-secondary-300/60 backdrop-blur-lg rounded-2xl p-8 border border-secondary-300/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient-secondary">Invoices</h1>
              <p className="text-secondary-700 mt-2">Manage and track your invoices</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="btn btn-outline group">
                <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Search
              </button>
              <button className="btn btn-outline group">
                <Filter className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                Filter
              </button>
              <button 
                className="btn btn-outline group"
                onClick={() => setShowCustomizer(true)}
              >
                <Palette className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Customize Invoice
              </button>
              <button 
                className="btn btn-primary group" 
                onClick={() => setShowAddModal(true)}
                data-testid="add-invoice-btn"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Add Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-4xl shadow-lg relative mx-4 my-8 border border-gray-700">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none" 
              onClick={() => setShowAddModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Create New Invoice</h2>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Client *
                  </label>
                  <select
                    value={newInvoice.clientId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, clientId: e.target.value, projectId: '' })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Project (Optional)
                  </label>
                  <select
                    value={newInvoice.projectId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, projectId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    disabled={!newInvoice.clientId}
                  >
                    <option value="">Select a project (optional)</option>
                    {getFilteredProjects().map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={newInvoice.currency}
                    onChange={(e) => setNewInvoice({ ...newInvoice, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-200">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="border border-gray-600 rounded-md p-4 bg-gray-800">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-200">Item {index + 1}</h4>
                        {newInvoice.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-5">
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Description *
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                            placeholder="Item description"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Rate *
                          </label>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Tax %
                          </label>
                          <input
                            type="number"
                            value={item.taxRate || 0}
                            onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Amount
                          </label>
                          <div className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-300">
                            ${item.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-white">
                    Total: ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={newInvoice.terms}
                    onChange={(e) => setNewInvoice({ ...newInvoice, terms: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Payment terms and conditions"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddInvoice}
                disabled={submitting || !newInvoice.clientId || !newInvoice.dueDate || newInvoice.items.some(item => !item.description || item.quantity <= 0 || item.rate < 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Customization Modal */}
      {showCustomizer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-6xl shadow-lg relative mx-4 my-8 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none z-10" 
              onClick={() => setShowCustomizer(false)}
            >
              &times;
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-white">Customize Invoice Templates</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Template Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Choose Template</h3>
                <div className="space-y-4">
                  {defaultTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        invoiceCustomization.template === template.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => {
                        setInvoiceCustomization(prev => ({
                          ...prev,
                          template: template.id,
                          colors: template.colors,
                          fonts: template.fonts
                        }));
                      }}
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className="w-16 h-12 rounded border-2 flex items-center justify-center text-2xl"
                          style={{ 
                            borderColor: template.colors.primary,
                            backgroundColor: template.colors.accent 
                          }}
                        >
                          {template.id === 'modern-minimal' ? '📄' : 
                           template.id === 'professional-corporate' ? '🏢' : '🎨'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-100">{template.name}</h4>
                          <p className="text-sm text-gray-400">{template.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Color Customization */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Customize Colors</h3>
                  <div className="space-y-3">
                    {Object.entries(invoiceCustomization.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-gray-300 capitalize text-sm">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </label>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-600"
                            style={{ backgroundColor: value }}
                          />
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => setInvoiceCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, [key]: e.target.value }
                            }))}
                            className="w-12 h-6 rounded border border-gray-600 bg-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Company Branding</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Company Name:</label>
                    <input
                      type="text"
                      value={invoiceCustomization.companyName}
                      onChange={(e) => setInvoiceCustomization(prev => ({
                        ...prev,
                        companyName: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Address:</label>
                    <textarea
                      value={invoiceCustomization.companyAddress}
                      onChange={(e) => setInvoiceCustomization(prev => ({
                        ...prev,
                        companyAddress: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Phone:</label>
                      <input
                        type="text"
                        value={invoiceCustomization.companyPhone}
                        onChange={(e) => setInvoiceCustomization(prev => ({
                          ...prev,
                          companyPhone: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Email:</label>
                      <input
                        type="email"
                        value={invoiceCustomization.companyEmail}
                        onChange={(e) => setInvoiceCustomization(prev => ({
                          ...prev,
                          companyEmail: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Website:</label>
                    <input
                      type="text"
                      value={invoiceCustomization.companyWebsite || ''}
                      onChange={(e) => setInvoiceCustomization(prev => ({
                        ...prev,
                        companyWebsite: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Footer Text:</label>
                    <input
                      type="text"
                      value={invoiceCustomization.footerText}
                      onChange={(e) => setInvoiceCustomization(prev => ({
                        ...prev,
                        footerText: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Currency:</label>
                      <select
                        value={invoiceCustomization.currency}
                        onChange={(e) => setInvoiceCustomization(prev => ({
                          ...prev,
                          currency: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="AUD">AUD (A$)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Fonts:</label>
                      <select
                        value={invoiceCustomization.fonts.body}
                        onChange={(e) => setInvoiceCustomization(prev => ({
                          ...prev,
                          fonts: { ...prev.fonts, body: e.target.value, heading: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                      >
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Poppins, sans-serif">Poppins</option>
                        <option value="Roboto, sans-serif">Roboto</option>
                        <option value="Arial, sans-serif">Arial</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={invoiceCustomization.showCompanyDetails}
                        onChange={(e) => setInvoiceCustomization(prev => ({
                          ...prev,
                          showCompanyDetails: e.target.checked
                        }))}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      <span className="text-sm text-gray-300">Show company details on invoice</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Preview</h3>
              <div className="bg-white rounded-lg p-4 max-h-64 overflow-auto">
                <div className="text-center text-gray-500 py-8">
                  <p>🎨 Template: <strong>{defaultTemplates.find(t => t.id === invoiceCustomization.template)?.name}</strong></p>
                  <p className="text-sm mt-2">Your customized invoice will use these settings</p>
                  <div className="flex justify-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: invoiceCustomization.colors.primary }}
                      />
                      <span className="text-xs">Primary</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: invoiceCustomization.colors.secondary }}
                      />
                      <span className="text-xs">Secondary</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: invoiceCustomization.colors.accent }}
                      />
                      <span className="text-xs">Accent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowCustomizer(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveCustomization(invoiceCustomization)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Customization</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="gradient-border">
        <div className="gradient-border-content">
          {loading && <div className="text-center py-8">Loading invoices...</div>}
          {error === 'authentication' && (
            <div className="text-center py-8">
              <div className="text-yellow-500 mb-2">🔒 Please log in to view invoices</div>
              <div className="text-sm text-gray-400 mb-4">You need to be authenticated to access this data.</div>
              <a 
                href="/login" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </a>
            </div>
          )}
          {error && error !== 'authentication' && (
            <div className="text-center text-red-500 py-8">Error: {error}</div>
          )}
          {!loading && (!error || error === 'authentication') && invoices.length === 0 && (
            <div className="text-center py-8 text-secondary-700">
              <div className="text-lg mb-2">📄 No invoices found</div>
              <div className="text-sm">Create your first invoice to get started!</div>
            </div>
          )}
          {!loading && !error && invoices.length > 0 && (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-4">Invoice #</th>
                  <th className="text-left py-2 px-4">Client</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Total</th>
                  <th className="text-left py-2 px-4">Due Date</th>
                  <th className="text-left py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} className="border-t">
                    <td className="py-2 px-4 font-semibold">{inv.invoiceNumber}</td>
                    <td className="py-2 px-4">{inv.client?.companyName || inv.clientId}</td>
                    <td className="py-2 px-4">{inv.status}</td>
                    <td className="py-2 px-4">${(inv.totalAmount || 0).toLocaleString()}</td>
                    <td className="py-2 px-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => handleDownloadInvoice(inv)}
                        className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                        title="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage; 