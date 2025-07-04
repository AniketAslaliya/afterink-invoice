// @ts-ignore
// eslint-disable-next-line
// declare module 'html2pdf.js';

import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Filter, Trash2, Download, Palette, Save, FileText, CheckCircle, Clock, AlertCircle, Eye, Edit, DollarSign } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../api';
import { InvoicePreview, defaultTemplates, InvoiceCustomization } from '../components/InvoiceTemplates';
import type { Invoice } from '../components/InvoiceTemplates';

// Define types that are used in this component
type InvoiceItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number;
};

type Client = {
  _id: string;
  companyName: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    position?: string;
    countryCode?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  status: string;
  paymentTerms?: number;
  taxNumber?: string;
  notes?: string;
};

type Project = {
  _id: string;
  name: string;
  clientId: string;
};
import { useAppSelector, useAppDispatch } from '../store';
import { fetchInvoices } from '../store/invoicesSlice';
import html2pdf from 'html2pdf.js';

const defaultCustomization: InvoiceCustomization = {
  template: 'indian-professional',
  companyName: 'Afterink Studio',
  companyAddress: '123 Business Street, Suite 100, City, State 12345',
  companyPhone: '+91 98765 43210',
  companyEmail: 'hello@afterink.com',
  companyWebsite: 'www.afterink.com',
  colors: {
    primary: '#ff6b35',
    secondary: '#004e89',
    text: '#2c3e50',
    background: '#ffffff',
    accent: '#fff3e0'
  },
  fonts: {
    heading: 'Poppins, sans-serif',
    body: 'Inter, sans-serif'
  },
  showLogo: false,
  showCompanyDetails: true,
  showPaymentTerms: true,
  paymentTermsText: 'Payment is due within 7 days of invoice date.',
  footerText: 'Thank you for choosing our services!',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  termsAndConditions: 'All services are subject to our standard terms and conditions.'
};

/**
 * InvoicesPage - Displays a list of invoices fetched from the backend.
 * Allows searching, filtering, and adding new invoices.
 */
const InvoicesPage: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Payment tracking state
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'bank_transfer' as 'bank_transfer' | 'paypal' | 'upi' | 'cash' | 'cheque' | 'card',
    transactionId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: '',
    clientId: '',
    projectId: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0, taxRate: 0 }],
    currency: 'INR',
    notes: '',
    terms: '',
    termsAndConditions: '',
  });
  
  // Template customization states
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [invoiceCustomization, setInvoiceCustomization] = useState<InvoiceCustomization>(() => {
    const saved = localStorage.getItem('invoiceCustomization');
    return saved ? JSON.parse(saved) : defaultCustomization;
  });

  // Add this state for settings
  const [appSettings, setAppSettings] = useState(null);

  // Add this state for client address checkbox
  const [showClientAddress, setShowClientAddress] = useState(true);

  // State for new client form in merged modal
  const [showNewClientFields, setShowNewClientFields] = useState(false);
  const [newClient, setNewClient] = useState({
    companyName: '',
    contactPerson: { firstName: '', lastName: '', email: '', phone: '', position: '', countryCode: '+91' },
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    status: 'active',
    paymentTerms: 30,
    taxNumber: '',
    notes: ''
  });
  const [addClientError, setAddClientError] = useState<string | null>(null);

  // State for editing an invoice
  const [editInvoice, setEditInvoice] = useState<any>(null);

  const invoices = useAppSelector((state: any) => state.invoices.invoices);
  const pagination = useAppSelector((state: any) => state.invoices.pagination);
  const loading = useAppSelector((state: any) => state.invoices.loading);
  const [error, setError] = useState(null);
  const dispatch = useAppDispatch();

  // Add a ref to the invoice preview node
  const invoicePreviewRef = useRef(null);
  const [pdfInvoice, setPdfInvoice] = useState<Invoice | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [allInvoices, setAllInvoices] = useState<any[]>([]); // for total revenue

  useEffect(() => {
    dispatch(fetchInvoices({ page, limit }));
  }, [dispatch, page, limit]);

  // Fetch all invoices for total revenue (background)
  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet('/invoices?limit=10000');
        setAllInvoices(res.data?.invoices || res.invoices || res || []);
      } catch (e) {
        setAllInvoices([]);
      }
    })();
  }, []);

  // Calculate total revenue for all invoices
  const totalRevenue = allInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);

  // Pagination controls
  const handleNextPage = () => setPage((p) => Math.min(p + 1, pagination.pages));
  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));

  // Fetch invoices from backend on mount
  useEffect(() => {
    fetchProjects();
    
    // Load business settings and apply to invoice customization
    const businessSettings = localStorage.getItem('businessSettings')
    if (businessSettings) {
      const settings = JSON.parse(businessSettings)
      setInvoiceCustomization(prev => ({
        ...prev,
        colors: {
          ...prev.colors,
          primary: settings.primaryColor,
          secondary: settings.secondaryColor
        },
        companyName: settings.companyName || prev.companyName,
        companyAddress: settings.address ? 
          `${settings.address}, ${settings.city}, ${settings.state} ${settings.zipCode}, ${settings.country}` : 
          prev.companyAddress
      }))
    }
    
    // Check for pre-selected project from Projects page
    const preselectedProject = sessionStorage.getItem('preselectedProject');
    if (preselectedProject) {
      const projectData = JSON.parse(preselectedProject);
      setNewInvoice(prev => ({
        ...prev,
        projectId: projectData.id
      }));
      setShowAddModal(true);
      sessionStorage.removeItem('preselectedProject');
    }
  }, [])

  // Add this effect to fetch settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiGet('/settings');
      if (res && res.data) {
        setAppSettings(res.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

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

  // Fetch next invoice number when modal opens
  useEffect(() => {
    if (showAddModal) {
      generateNextInvoiceNumber();
    }
  }, [showAddModal]);

  // Helper to get default terms
  const getDefaultTerms = () => invoiceCustomization.termsAndConditions || 'Payment is due within 7 days of invoice date.';

  const handleAddInvoice = async () => {
    let clientId = newInvoice.clientId;
    // If adding a new client, validate and create client first
    if (showNewClientFields) {
      if (!newClient.contactPerson.firstName.trim() || !newClient.contactPerson.lastName.trim() || !newClient.companyName.trim()) {
        setAddClientError('Company Name, First Name, and Last Name are required for the client.');
        return;
      } else {
        setAddClientError(null);
      }
      // Create client
      try {
        const clientRes = await apiPost('/clients', newClient);
        if (clientRes && (clientRes.data?.client?._id || clientRes.client?._id || clientRes._id)) {
          clientId = clientRes.data?.client?._id || clientRes.client?._id || clientRes._id;
        } else {
          throw new Error('Failed to create client');
        }
      } catch (err) {
        setAddClientError('Failed to create client.');
        setSubmitting(false);
        return;
      }
    }

    try {
      setSubmitting(true)
      
      // Calculate totals before sending
      const subtotal = newInvoice.items.reduce((sum: number, item: InvoiceItem) => sum + item.amount, 0)
      const taxAmount = newInvoice.items.reduce((sum: number, item: InvoiceItem) => {
        const itemTax = item.amount * (item.taxRate || 0) / 100
        return sum + itemTax
      }, 0)
      const totalAmount = subtotal + taxAmount
      
      const invoiceData: any = {
        ...newInvoice,
        clientId,
        totalAmount: totalAmount,
        currency: newInvoice.currency,
        terms: newInvoice.terms || getDefaultTerms(),
      };
      
      // Remove projectId if empty string
      if (typeof invoiceData.projectId !== 'undefined' && !invoiceData.projectId) {
        const { projectId, ...dataWithoutProjectId } = invoiceData;
        Object.assign(invoiceData, dataWithoutProjectId);
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
      
      dispatch(fetchInvoices({ page, limit }));
      setShowAddModal(false)
      // Reset form
      setNewInvoice({
        invoiceNumber: '',
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
        currency: 'INR',
        notes: '',
        terms: getDefaultTerms(),
        termsAndConditions: getDefaultTerms(),
      });
      // Fetch next invoice number for the next use
      generateNextInvoiceNumber();
      
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
    setNewInvoice((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: InvoiceItem, i: number) => i !== index),
    }));
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setNewInvoice((prev: any) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
        items[index].amount = items[index].quantity * items[index].rate;
    }
      return { ...prev, items };
    });
  }

  const calculateTotal = () => {
    return newInvoice.items.reduce((total, item) => total + item.amount, 0)
  }

  const getFilteredProjects = () => {
    return projects.filter((project: any) => project.clientId === newInvoice.clientId)
  }

  const formatCurrency = (amount: number, currency?: string) => {
    // Use the provided currency or fall back to customization currency
    const currencyToUse = currency || invoiceCustomization.currency;
    
    // Use appropriate locale based on currency
    const locale = currencyToUse === 'INR' ? 'en-IN' : 
                   currencyToUse === 'USD' ? 'en-US' :
                   currencyToUse === 'EUR' ? 'en-DE' :
                   currencyToUse === 'GBP' ? 'en-GB' : 'en-IN';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyToUse,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // PDF download handler
  const handleDownloadPDF = (invoice: Invoice) => {
    setPdfInvoice(invoice);
      setTimeout(() => {
      if (invoicePreviewRef.current) {
        html2pdf(invoicePreviewRef.current, {
          margin: 0,
          filename: `${invoice.invoiceNumber || 'invoice'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        });
      }
    }, 200); // Wait for preview to render
  };

  const handleSaveCustomization = (customization: InvoiceCustomization) => {
    setInvoiceCustomization(customization);
    localStorage.setItem('invoiceCustomization', JSON.stringify(customization));
    setShowCustomizer(false);
  };

  // Generate proper invoice ID: YYYYMMDD + A + sequential number
  // const generateInvoiceId = () => {
  //   const now = new Date();
  //   const year = now.getFullYear();
  //   const month = String(now.getMonth() + 1).padStart(2, '0');
  //   const day = String(now.getDate()).padStart(2, '0');
  //   const sequence = (invoices.length + 1).toString().padStart(6, '0');
  //   return `${year}${month}${day}A${sequence}`;
  // };

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter((invoice: Invoice) => {
      const matchesSearch = searchTerm === '' || 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === '' || invoice.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        const invoiceDate = new Date(invoice.dueDate);
        matchesDate = invoiceDate >= filterDate;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a: Invoice, b: Invoice) => {
      switch (sortBy) {
        case 'amount-high':
          return b.totalAmount - a.totalAmount;
        case 'amount-low':
          return a.totalAmount - b.totalAmount;
        case 'due-date':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'oldest':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'newest':
        default:
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
    });

  // Handle payment update
  const handlePaymentUpdate = async (invoice: Invoice, status: 'paid' | 'partial' | 'overdue') => {
    try {
      setSubmitting(true);
      const paymentInfo = {
        status,
        paymentAmount: paymentData.amount,
        paymentMethod: paymentData.method,
        transactionId: paymentData.transactionId,
        paymentDate: paymentData.date,
        paymentNotes: paymentData.notes
      };
      
      await apiPost(`/invoices/${invoice._id}/payment`, paymentInfo);
      
      // Update local state
      dispatch(fetchInvoices(invoices.map((inv: Invoice) => 
        inv._id === invoice._id 
          ? { ...inv, ...paymentInfo }
          : inv
      )));
      
      setShowPaymentModal(false);
      setPaymentData({
        amount: 0,
        method: 'bank_transfer',
        transactionId: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      console.error('Error updating payment:', error);
      setError(error.message || 'Failed to update payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view invoice
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  // Handle edit invoice
  const handleEditInvoice = (invoice: Invoice) => {
    setEditInvoice({
      ...invoice,
      clientId: '',
      projectId: '',
      items: invoice.items ? invoice.items.map(item => ({ ...item })) : [],
      notes: invoice.notes || '',
      terms: invoice.terms || getDefaultTerms(),
      termsAndConditions: (invoice as any).termsAndConditions || '',
      currency: invoice.currency || 'INR',
    });
    setSelectedInvoice(invoice);
    setShowEditModal(true);
  };

  // Handle update invoice
  const handleUpdateInvoice = async () => {
    if (!selectedInvoice || !editInvoice) return;
    try {
      setSubmitting(true);
      const invoiceData = {
        ...editInvoice,
        totalAmount: handleEditCalculateTotal(),
        currency: editInvoice.currency,
      };
      if (typeof invoiceData.projectId !== 'undefined' && !invoiceData.projectId) {
        delete invoiceData.projectId;
      }
      console.log('Updating invoice with data:', invoiceData);
      const result = await apiPut(`/invoices/${selectedInvoice._id}`, invoiceData);
      console.log('Update result:', result);
      dispatch(fetchInvoices({ page, limit }));
      setShowEditModal(false);
      setSelectedInvoice(null);
      setEditInvoice(null);
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      alert('Error updating invoice: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Add this function to generate next invoice number
  const generateNextInvoiceNumber = async () => {
    try {
      const res = await apiGet('/invoices/next-number');
      if (res && res.data && res.data.invoiceNumber) {
        setNewInvoice(prev => ({ ...prev, invoiceNumber: res.data.invoiceNumber }));
      }
    } catch (error) {
      console.error('Error generating invoice number:', error);
    }
  };

  // Add useEffect for keyboard escape handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showViewModal) setShowViewModal(false);
        if (showEditModal) setShowEditModal(false);
        if (showAddModal) setShowAddModal(false);
        if (showPaymentModal) setShowPaymentModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showViewModal, showEditModal, showAddModal, showPaymentModal]);

  const handleEditItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setEditInvoice((prev: any) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      // Recalculate amount if quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        items[index].amount = items[index].quantity * items[index].rate;
      }
      return { ...prev, items };
    });
  };

  const handleEditAddItem = () => {
    setEditInvoice((prev: any) => ({
      ...prev,
      items: [
        ...prev.items,
        { description: '', quantity: 1, rate: 0, amount: 0, taxRate: 0 },
      ],
    }));
  };

  const handleEditRemoveItem = (index: number) => {
    setEditInvoice((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleEditCalculateTotal = () => {
    return editInvoice.items.reduce((total: number, item: InvoiceItem) => total + item.amount, 0);
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
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-4xl shadow-lg relative mx-4 my-8 border border-gray-700 modal-content max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none cursor-pointer" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddModal(false);
              }}
              type="button"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Create New Invoice</h2>
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Client Details Section */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300 mr-2">Client *</label>
                  <select
                    value={showNewClientFields ? '' : newInvoice.clientId}
                    onChange={(e) => {
                      setShowNewClientFields(false);
                      setNewInvoice({ ...newInvoice, clientId: e.target.value, projectId: '' });
                    }}
                    className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>{client.companyName}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    onClick={() => {
                      setShowNewClientFields(true);
                      setNewInvoice({ ...newInvoice, clientId: '' });
                    }}
                  >
                    Add New Client
                  </button>
          </div>
                {showNewClientFields && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Company Name *</label>
                      <input
                        type="text"
                        value={newClient.companyName}
                        onChange={e => setNewClient({ ...newClient, companyName: e.target.value })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        placeholder="Company name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                  <select
                        value={newClient.status}
                        onChange={e => setNewClient({ ...newClient, status: e.target.value as any })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                  >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="prospect">Prospect</option>
                  </select>
        </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={newClient.contactPerson.firstName}
                        onChange={e => setNewClient({ ...newClient, contactPerson: { ...newClient.contactPerson, firstName: e.target.value } })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={newClient.contactPerson.lastName}
                        onChange={e => setNewClient({ ...newClient, contactPerson: { ...newClient.contactPerson, lastName: e.target.value } })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        placeholder="Last name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={newClient.contactPerson.email}
                        onChange={e => setNewClient({ ...newClient, contactPerson: { ...newClient.contactPerson, email: e.target.value } })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        placeholder="Email"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={newClient.contactPerson.phone}
                        onChange={e => setNewClient({ ...newClient, contactPerson: { ...newClient.contactPerson, phone: e.target.value } })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        placeholder="Phone"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Position</label>
                      <input
                        type="text"
                        value={newClient.contactPerson.position}
                        onChange={e => setNewClient({ ...newClient, contactPerson: { ...newClient.contactPerson, position: e.target.value } })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        placeholder="Position"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Country Code</label>
                      <input
                        type="text"
                        value={newClient.contactPerson.countryCode}
                        onChange={e => setNewClient({ ...newClient, contactPerson: { ...newClient.contactPerson, countryCode: e.target.value } })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        placeholder="Country code"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-400 mb-1">Address</label>
                      <input
                        type="text"
                        value={newClient.address.street}
                        onChange={e => setNewClient({ ...newClient, address: { ...newClient.address, street: e.target.value } })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white mb-1"
                        placeholder="Street address"
                      />
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <input
                          type="text"
                          value={newClient.address.city}
                          onChange={e => setNewClient({ ...newClient, address: { ...newClient.address, city: e.target.value } })}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={newClient.address.state}
                          onChange={e => setNewClient({ ...newClient, address: { ...newClient.address, state: e.target.value } })}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                          placeholder="State"
                        />
                        <input
                          type="text"
                          value={newClient.address.zipCode}
                          onChange={e => setNewClient({ ...newClient, address: { ...newClient.address, zipCode: e.target.value } })}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                          placeholder="Zip code"
                        />
                      </div>
                      <input
                        type="text"
                        value={newClient.address.country}
                        onChange={e => setNewClient({ ...newClient, address: { ...newClient.address, country: e.target.value } })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white mt-1"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                )}
                {addClientError && (
                  <div className="text-red-500 text-sm mt-2">{addClientError}</div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Invoice Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInvoice.invoiceNumber}
                      onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Enter invoice number"
                    />
                    <button
                      type="button"
                      onClick={generateNextInvoiceNumber}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      title="Generate next invoice number"
                    >
                      Auto
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Make sure the invoice number is unique</p>
                </div>
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
                    disabled={selectedInvoice?.status === 'paid' || selectedInvoice?.status === 'sent'}
                  >
                    <option value="INR">INR</option>
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
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none z-10 cursor-pointer" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCustomizer(false);
              }}
              type="button"
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
                        <option value="INR">INR (₹)</option>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCustomizer(false);
                }}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800 cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveCustomization(invoiceCustomization);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 cursor-pointer"
                type="button"
              >
                <Save className="h-4 w-4" />
                <span>Save Customization</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search and Filters */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-600 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search invoices by number, client name, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            />
          </div>
          
          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          
          {/* Date Range Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            placeholder="Filter by date"
          />

          {/* Sort Options */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Amount: High to Low</option>
            <option value="amount-low">Amount: Low to High</option>
            <option value="due-date">By Due Date</option>
          </select>
        </div>
      </div>

      {/* Invoice Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Total Invoices</p>
              <p className="text-2xl font-bold text-white">{invoices.length}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-xl">
              <FileText className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Paid</p>
              <p className="text-2xl font-bold text-white">{invoices.filter((inv: Invoice) => inv.status === 'paid').length}</p>
            </div>
            <div className="bg-green-600 p-3 rounded-xl">
              <CheckCircle className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-white">{invoices.filter((inv: Invoice) => inv.status === 'pending').length}</p>
            </div>
            <div className="bg-yellow-600 p-3 rounded-xl">
              <Clock className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">Overdue</p>
              <p className="text-2xl font-bold text-white">
                {invoices.filter((inv: Invoice) => {
                  const dueDate = new Date(inv.dueDate);
                  return inv.status === 'pending' && dueDate < new Date();
                }).length}
              </p>
            </div>
            <div className="bg-red-600 p-3 rounded-xl">
              <AlertCircle className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">All Invoices</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{filteredInvoices.length} of {invoices.length} invoices</span>
              <button 
                onClick={() => setShowCustomizer(true)}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-700 rounded-lg transition-colors"
                title="Customize Templates"
              >
                <Palette size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-300">Loading invoices...</span>
            </div>
          )}
          
          {error === 'authentication' && (
            <div className="text-center py-12">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-yellow-400 text-4xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold text-white mb-2">Authentication Required</h3>
                <p className="text-gray-300 text-sm mb-4">Please log in to view your invoices</p>
                <a 
                  href="/login" 
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Go to Login
                </a>
              </div>
            </div>
          )}
          
          {error && error !== 'authentication' && (
            <div className="text-center py-12">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Invoices</h3>
                <p className="text-gray-300 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {!loading && (!error || error === 'authentication') && invoices.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-8 max-w-md mx-auto">
                <div className="text-gray-500 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-white mb-2">No Invoices Yet</h3>
                <p className="text-gray-300 text-sm mb-6">Create your first invoice to get started with your business!</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-all"
                >
                  <Plus size={20} />
                  Create First Invoice
                </button>
              </div>
            </div>
          )}
          
          {!loading && !error && filteredInvoices.length > 0 && (
            <div className="space-y-4">
              {filteredInvoices.map((inv: Invoice) => {
                const isOverdue = new Date(inv.dueDate) < new Date() && inv.status === 'pending';
                const statusColors: Record<string, string> = {
                  'paid': 'bg-green-900 text-green-400 border-green-700',
                  'pending': 'bg-yellow-900 text-yellow-400 border-yellow-700',
                  'draft': 'bg-gray-700 text-gray-300 border-gray-600',
                  'overdue': 'bg-red-900 text-red-400 border-red-700'
                };
                const currentStatus = isOverdue ? 'overdue' : inv.status;
                
                return (
                  <div key={inv._id} className="border border-gray-600 rounded-xl p-6 hover:shadow-lg hover:bg-gray-700 transition-all duration-200 group">
                    <div className="flex items-center justify-between">
                      {/* Left Section - Invoice Info */}
                      <div className="flex items-center gap-6">
                          <div className="bg-blue-900 p-3 rounded-xl">
                            <FileText className="text-blue-400" size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">#{inv.invoiceNumber}</h3>
                            <p className="text-gray-400 text-sm">{inv.client?.companyName || 'Unknown Client'}</p>
                          <p className="text-white text-base font-bold mt-1">{formatCurrency(inv.totalAmount || 0, inv.currency)}</p>
                        </div>
                      </div>

                      {/* Right Section - Status and Actions */}
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[currentStatus]}`}>
                          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadPDF(inv)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded-lg transition-all"
                            title="Download Invoice"
                          >
                            <Download size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleViewInvoice(inv)}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-600 rounded-lg transition-all"
                            title="View Invoice"
                          >
                            <Eye size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleEditInvoice(inv)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded-lg transition-all"
                            title="Edit Invoice"
                          >
                            <Edit size={18} />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentData(prev => ({ ...prev, amount: inv.totalAmount }));
                              setShowPaymentModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-600 rounded-lg transition-all"
                            title="Update Payment"
                          >
                            <DollarSign size={18} />
                          </button>
                          
                          <button
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-600 rounded-lg transition-all"
                            title="Edit Invoice"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile-only sections */}
                    <div className="md:hidden mt-4 pt-4 border-t border-gray-600">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-400 text-sm">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="font-bold text-white">{formatCurrency(inv.totalAmount || 0, inv.currency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Update Modal */}
      {showPaymentModal && selectedInvoice && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPaymentModal(false);
            }
          }}
        >
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl shadow-lg relative mx-4 my-8 border border-gray-700 max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none cursor-pointer" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPaymentModal(false);
              }}
              type="button"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Update Payment Status</h2>
            
            <div className="space-y-6">
              {/* Invoice Details */}
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-600">
                <h3 className="font-semibold text-white mb-2">Invoice Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Invoice:</span>
                    <span className="text-white ml-2">#{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Client:</span>
                    <span className="text-white ml-2">{selectedInvoice.client?.companyName || 'Unknown Client'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Amount:</span>
                    <span className="text-white ml-2 font-semibold">{formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Due Date:</span>
                    <span className="text-white ml-2">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Amount *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  min="0"
                  step="0.01"
                  max={selectedInvoice.totalAmount}
                />
                                    <p className="text-xs text-gray-400 mt-1">Maximum: {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}</p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Method *</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="paypal">PayPal</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Transaction/Reference ID</label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Enter transaction ID or reference number"
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              {/* Payment Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Additional payment notes..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800"
                disabled={submitting}
              >
                Cancel
              </button>
              
              {paymentData.amount < selectedInvoice.totalAmount && (
                <button
                  onClick={() => handlePaymentUpdate(selectedInvoice, 'partial')}
                  disabled={submitting || paymentData.amount <= 0}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : 'Mark as Partial'}
                </button>
              )}
              
              <button
                onClick={() => handlePaymentUpdate(selectedInvoice, paymentData.amount >= selectedInvoice.totalAmount ? 'paid' : 'partial')}
                disabled={submitting || paymentData.amount <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : paymentData.amount >= selectedInvoice.totalAmount ? 'Mark as Paid' : 'Record Payment'}
              </button>
              
              <button
                onClick={() => handlePaymentUpdate(selectedInvoice, 'overdue')}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Mark as Overdue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice View Modal */}
      {showViewModal && selectedInvoice && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 overflow-y-auto modal-backdrop p-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowViewModal(false);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl relative my-4 modal-content invoice-view-modal cursor-default"
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'default' }}
          >
            {/* Header - Sticky */}
            <div className="modal-header rounded-t-2xl flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Invoice Preview</h2>
                <p className="text-gray-600 text-sm md:text-base">#{selectedInvoice.invoiceNumber}</p>
                <p className="text-xs text-gray-400 mt-1">Click outside to close • Press ESC to close</p>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 md:space-x-2 text-sm md:text-base"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
                <button 
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center cursor-pointer transition-colors" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowViewModal(false);
                  }}
                  type="button"
                  title="Close (ESC)"
                >
                  &times;
                </button>
              </div>
            </div>
            
            {/* Content - Scrollable */}
            <div className="modal-body bg-white" style={{ fontFamily: invoiceCustomization.fonts.body }}>
              <div className="invoice-preview-container">
                <div className="flex justify-center">
                  <InvoicePreview
                  invoice={{
                    _id: selectedInvoice._id,
                    invoiceNumber: selectedInvoice.invoiceNumber,
                    client: selectedInvoice.client || { 
                      companyName: 'Unknown Client', 
                      contactPerson: { firstName: '', lastName: '', email: '' }, 
                      address: { street: '', city: '', state: '', zipCode: '', country: '' } 
                    },
                    project: selectedInvoice.project || undefined,
                    items: selectedInvoice.items || [{ 
                      description: 'Professional Services', 
                      quantity: 1, 
                      rate: selectedInvoice.totalAmount, 
                      amount: selectedInvoice.totalAmount, 
                      taxRate: 0 
                    }],
                    subtotal: selectedInvoice.totalAmount || 0,
                    taxAmount: 0,
                    totalAmount: selectedInvoice.totalAmount || 0,
                    dueDate: selectedInvoice.dueDate,
                    status: selectedInvoice.status || 'draft',
                    notes: selectedInvoice.notes || '',
                    terms: selectedInvoice.terms || '',
                    createdAt: selectedInvoice.createdAt || new Date().toISOString(),
                    currency: selectedInvoice.currency || 'INR',
                  }}
                  customization={Object.assign({}, invoiceCustomization, {
                    paymentTermsText: invoiceCustomization.paymentTermsText || 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.',
                    dateFormat: invoiceCustomization.dateFormat || 'DD/MM/YYYY',
                    termsAndConditions: ((appSettings as any)?.termsAndConditions) || invoiceCustomization.termsAndConditions || '',
                    currency: selectedInvoice.currency || invoiceCustomization.currency || 'INR',
                  }) as InvoiceCustomization}
                  template={defaultTemplates.find(t => t.id === invoiceCustomization.template) || defaultTemplates[0]}
                  showClientAddress={showClientAddress}
                  ref={invoicePreviewRef}
                />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Edit Modal */}
      {showEditModal && selectedInvoice && editInvoice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setEditInvoice(null);
            }
          }}
        >
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-4xl shadow-lg relative mx-4 my-8 border border-gray-700 modal-content max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none cursor-pointer" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowEditModal(false);
                setEditInvoice(null);
              }}
              type="button"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Edit Invoice</h2>
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Client *</label>
                  <select
                    value={editInvoice.clientId}
                    onChange={(e) => setEditInvoice({ ...editInvoice, clientId: e.target.value, projectId: '' })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>{client.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project (Optional)</label>
                  <select
                    value={editInvoice.projectId}
                    onChange={(e) => setEditInvoice({ ...editInvoice, projectId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    disabled={!editInvoice.clientId}
                  >
                    <option value="">Select a project (optional)</option>
                    {getFilteredProjects().map((project) => (
                      <option key={project._id} value={project._id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Invoice Number</label>
                    <input
                      type="text"
                    value={editInvoice.invoiceNumber}
                    onChange={(e) => setEditInvoice({ ...editInvoice, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Enter invoice number"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={editInvoice.dueDate}
                    onChange={(e) => setEditInvoice({ ...editInvoice, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
                  <select
                    value={editInvoice.currency}
                    onChange={(e) => setEditInvoice({ ...editInvoice, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="INR">INR</option>
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
                    onClick={handleEditAddItem}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                    >
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                  {editInvoice.items.map((item: InvoiceItem, index: number) => (
                      <div key={index} className="border border-gray-600 rounded-md p-4 bg-gray-800">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-200">Item {index + 1}</h4>
                        {editInvoice.items.length > 1 && (
                            <button
                              type="button"
                            onClick={() => handleEditRemoveItem(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Description *</label>
                            <input
                              type="text"
                              value={item.description}
                            onChange={(e) => handleEditItem(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                            placeholder="Item description"
                              required
                            />
                          </div>
                          <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Quantity *</label>
                            <input
                              type="number"
                              value={item.quantity}
                            onChange={(e) => handleEditItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                            min="0.01"
                              step="0.01"
                              required
                            />
                          </div>
                          <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Rate *</label>
                            <input
                              type="number"
                              value={item.rate}
                            onChange={(e) => handleEditItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                          <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Tax %</label>
                            <input
                              type="number"
                              value={item.taxRate || 0}
                            onChange={(e) => handleEditItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                          <div className="col-span-1">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Amount</label>
                          <div className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-300">
                            {formatCurrency(item.amount, editInvoice.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">
                    Total: {formatCurrency(handleEditCalculateTotal(), editInvoice.currency)}
                </div>
                </div>
              </div>
              {/* Notes and Terms */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={editInvoice ? editInvoice.notes : newInvoice.notes}
                    onChange={e => editInvoice ? setEditInvoice({ ...editInvoice, notes: e.target.value }) : setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    rows={4}
                    placeholder="Add notes for this invoice..."
                  />
                  {/* Live preview for notes with line breaks */}
                  <div className="mt-2 p-2 bg-gray-900 border border-gray-700 rounded text-gray-200 text-sm">
                    <div dangerouslySetInnerHTML={{ __html: (editInvoice ? editInvoice.notes : newInvoice.notes || '').replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Payment Terms</label>
                  <textarea
                    value={editInvoice ? editInvoice.terms : newInvoice.terms}
                    onChange={e => editInvoice ? setEditInvoice({ ...editInvoice, terms: e.target.value }) : setNewInvoice({ ...newInvoice, terms: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    rows={2}
                    placeholder="Enter payment terms..."
                  />
                  <button
                    className="mt-2 px-3 py-1 bg-blue-700 text-white rounded text-xs"
                    onClick={() => {
                      localStorage.setItem('defaultPaymentTerms', editInvoice ? editInvoice.terms : newInvoice.terms);
                      alert('Default payment terms saved!');
                    }}
                    type="button"
                  >Save as Default</button>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Terms & Conditions</label>
                <textarea
                  value={editInvoice ? editInvoice.termsAndConditions : newInvoice.termsAndConditions}
                  onChange={e => editInvoice ? setEditInvoice({ ...editInvoice, termsAndConditions: e.target.value }) : setNewInvoice({ ...newInvoice, termsAndConditions: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  rows={2}
                  placeholder="Enter terms & conditions..."
                />
                <button
                  className="mt-2 px-3 py-1 bg-blue-700 text-white rounded text-xs"
                  onClick={() => {
                    localStorage.setItem('defaultTermsAndConditions', editInvoice ? editInvoice.termsAndConditions : newInvoice.termsAndConditions);
                    alert('Default terms & conditions saved!');
                  }}
                  type="button"
                >Save as Default</button>
                </div>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
              <button
                  onClick={() => { setShowEditModal(false); setEditInvoice(null); }}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInvoice}
                  disabled={submitting || !editInvoice.clientId || !editInvoice.dueDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update Invoice'}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF preview for download */}
      {pdfInvoice && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <InvoicePreview
            ref={invoicePreviewRef}
            invoice={{
              ...pdfInvoice,
              client: pdfInvoice.client || { companyName: '', contactPerson: { firstName: '', lastName: '', email: '' } },
              items: pdfInvoice.items || [],
            }}
            customization={invoiceCustomization}
            template={defaultTemplates.find(t => t.id === invoiceCustomization.template) || defaultTemplates[0]}
            isPreview={false}
            showClientAddress={false}
          />
        </div>
      )}

      {loading && <div className="flex justify-center items-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}

      <div className="flex gap-2 justify-center items-center mt-8 mb-8">
        <button onClick={handlePrevPage} disabled={page === 1 || loading} className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 focus:ring-2 focus:ring-blue-500" aria-label="Previous Page">Prev</button>
        <span className="text-white font-semibold">Page {pagination.page} of {pagination.pages}</span>
        <button onClick={handleNextPage} disabled={page === pagination.pages || loading} className="px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50" aria-label="Next Page">Next</button>
      </div>
    </div>
  );
};

export default InvoicesPage; 