// @ts-ignore
// eslint-disable-next-line
// declare module 'html2pdf.js';

import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Filter, Trash2, Download, Palette, Save, FileText, CheckCircle, Clock, AlertCircle, Eye, Edit, DollarSign, StickyNote, Check, Copy, Send, Undo, Redo, GripVertical, Package } from 'lucide-react';
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
  note?: string;
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
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast, { Toaster } from 'react-hot-toast';
import { useAutosave, autosaveManager } from '../utils/autosave';
import DraftManager from '../components/DraftManager';

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
    items: [{ description: '', quantity: 1, rate: 0, amount: 0, taxRate: 0, note: '' }],
    currency: 'INR',
    notes: '',
    terms: 'Payment is due within 30 days of invoice date.',
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

  // Add state for noteSaved checkmarks
  const [noteSaved, setNoteSaved] = useState<boolean[]>([]);

  // Add state for validation errors
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Add state for undo/redo stacks for add and edit invoice forms
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [undoStackEdit, setUndoStackEdit] = useState<any[]>([]);
  const [redoStackEdit, setRedoStackEdit] = useState<any[]>([]);
  
  // Add state for edit invoice history tracking
  const [editInvoiceHistory, setEditInvoiceHistory] = useState<any[]>([]);
  const [editInvoiceHistoryIndex, setEditInvoiceHistoryIndex] = useState(0);

  // Add state for draft management
  const [showDraftManager, setShowDraftManager] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

  // Autosave hooks for new and edit invoice forms
  useAutosave('new-invoice', newInvoice, { delay: 2000 });
  useAutosave('edit-invoice', editInvoice, { delay: 2000 });

  useEffect(() => {
    dispatch(fetchInvoices({ page, limit }));
  }, [dispatch, page, limit]);

  // Check for existing drafts on mount and offer to restore
  useEffect(() => {
    const checkForDrafts = () => {
      const hasDraft = autosaveManager.hasDraft('new-invoice');
      if (hasDraft && !showAddModal) {
        const draftAge = autosaveManager.getDraftAge('new-invoice');
        if (draftAge !== null && draftAge < 60) { // Show notification for drafts less than 1 hour old
          toast((t) => (
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Draft found!</p>
                <p className="text-sm text-gray-600">You have an unsaved invoice draft from {draftAge} minutes ago.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDraftManager(true);
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  View Drafts
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ), { duration: 10000 });
        }
      }
    };

    checkForDrafts();
    
    // Cleanup old drafts on mount
    autosaveManager.cleanupOldDrafts(7);
  }, [showAddModal]);

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
    fetchClients();
    
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

  const fetchClients = async () => {
    try {
      console.log('Fetching clients from API...')
      const res = await apiGet('/clients')
      console.log('Clients API Response:', res)
      console.log('Full response structure:', JSON.stringify(res, null, 2))
      
      // Handle the actual API response structure
      let clientsArray = [];
      if (res && res.success && res.data && res.data.clients) {
        // MongoDB server format: { success: true, data: { clients: [...], pagination: {...} } }
        clientsArray = res.data.clients;
        console.log('Using MongoDB server format - found clients:', clientsArray.length)
      } else if (res && res.data && res.data.clients) {
        // Alternative format: { data: { clients: [...] } }
        clientsArray = res.data.clients;
        console.log('Using alternative format - found clients:', clientsArray.length)
      } else if (res && Array.isArray(res.clients)) {
        // Direct clients array format: { clients: [...] }
        clientsArray = res.clients;
        console.log('Using direct clients format - found clients:', clientsArray.length)
      } else if (res && Array.isArray(res)) {
        // Direct array format: [...]
        clientsArray = res;
        console.log('Using direct array format - found clients:', clientsArray.length)
      } else {
        console.warn('Unexpected clients response structure:', res);
        console.warn('Available keys:', Object.keys(res || {}));
        clientsArray = []; // Default to empty array
      }
      
      console.log('Setting clients array:', clientsArray)
      setClients(clientsArray)
    } catch (error) {
      console.error('Error fetching clients:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      // Set empty array on error to prevent crashes
      setClients([])
    }
  }

  // Fetch next invoice number when modal opens
  useEffect(() => {
    if (showAddModal) {
      generateNextInvoiceNumber();
    }
  }, [showAddModal]);

  // Helper to get default payment terms from global settings
  const getDefaultPaymentTerms = () => {
    return (appSettings as any)?.paymentTerms || 'Payment is due within 30 days of invoice date.';
  };

  // Helper to get default terms and conditions from global settings
  const getDefaultTermsAndConditions = () => {
    return (appSettings as any)?.termsAndConditions || '';
  };

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
      
      // DEBUG: Log the notes, terms, and termsAndConditions field values
      console.log('Notes field value before sending:', newInvoice.notes);
      console.log('Terms field value before sending:', newInvoice.terms);
      console.log('Terms and Conditions field value before sending:', newInvoice.termsAndConditions);
      
      const invoiceData: any = {
        ...newInvoice,
        clientId,
        totalAmount: totalAmount,
        currency: newInvoice.currency,
        terms: newInvoice.terms || getDefaultPaymentTerms(),
        // Explicitly ensure notes and termsAndConditions fields are included
        notes: newInvoice.notes || '',
        termsAndConditions: newInvoice.termsAndConditions || getDefaultTermsAndConditions(),
      };
      
      // Remove projectId if empty string or undefined
      if (!invoiceData.projectId || invoiceData.projectId.trim() === '') {
        delete invoiceData.projectId;
      }
      
      console.log('Sending invoice data:', invoiceData)
      console.log('Notes in invoice data:', invoiceData.notes);
      console.log('Terms in invoice data:', invoiceData.terms);
      console.log('Terms and Conditions in invoice data:', invoiceData.termsAndConditions);
      
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
      
      // DEBUG: Log the notes, terms, and termsAndConditions fields in the response
      console.log('Notes in API response:', invoiceObject.notes);
      console.log('Terms in API response:', invoiceObject.terms);
      console.log('Terms and Conditions in API response:', invoiceObject.termsAndConditions);
      
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
          taxRate: 0,
          note: ''
        }],
        currency: 'INR',
        notes: '',
        terms: getDefaultPaymentTerms(),
        termsAndConditions: getDefaultTermsAndConditions(),
      });
      // Fetch next invoice number for the next use
      generateNextInvoiceNumber();
      
      console.log('Invoice created successfully!')
      toast.success(<span>Invoice created! <a href="#" onClick={() => handleViewInvoice(invoiceObject)} className="underline text-blue-600 ml-2">View</a> <a href="#" onClick={() => handleDownloadPDF(invoiceObject)} className="underline text-green-600 ml-2">Download</a></span>);
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
        taxRate: 0,
        note: ''
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
          html2canvas: { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          },
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

  // Add unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalEditInvoice, setOriginalEditInvoice] = useState<any>(null);

  // Track changes in edit invoice
  useEffect(() => {
    if (editInvoice && originalEditInvoice) {
      const hasChanges = JSON.stringify(editInvoice) !== JSON.stringify(originalEditInvoice);
      setHasUnsavedChanges(hasChanges);
    }
  }, [editInvoice, originalEditInvoice]);

  // Handle edit invoice
  const handleEditInvoice = (invoice: Invoice) => {
    console.log('Editing invoice, original terms:', invoice.terms); // DEBUG
    console.log('Editing invoice, original termsAndConditions:', (invoice as any).termsAndConditions); // DEBUG
    const editData = {
      ...invoice,
      clientId: invoice.client && (invoice.client as any)._id ? (invoice.client as any)._id : '',
      projectId: invoice.project && (invoice.project as any)._id ? (invoice.project as any)._id : '',
      items: invoice.items ? invoice.items.map(item => ({ ...item })) : [],
      notes: invoice.notes || '',
      terms: invoice.terms || getDefaultPaymentTerms(),
      termsAndConditions: (invoice as any).termsAndConditions || '',
      currency: invoice.currency || 'INR',
    };
    setEditInvoice(editData);
    setOriginalEditInvoice(JSON.parse(JSON.stringify(editData))); // Deep copy
    setSelectedInvoice(invoice);
    setShowEditModal(true);
    setHasUnsavedChanges(false);
    setValidationErrors({});
  };

  // Handle modal close with unsaved changes warning
  const handleCloseEditModal = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        setShowEditModal(false);
        setEditInvoice(null);
        setOriginalEditInvoice(null);
        setHasUnsavedChanges(false);
        setValidationErrors({});
      }
    } else {
      setShowEditModal(false);
      setEditInvoice(null);
      setOriginalEditInvoice(null);
      setValidationErrors({});
    }
  };

  // Validation function
  const validateEditInvoice = () => {
    const errors: {[key: string]: string} = {};
    
    // Client validation
    if (!editInvoice.clientId) {
      errors.clientId = 'Client is required';
    }
    
    // Due date validation
    if (!editInvoice.dueDate) {
      errors.dueDate = 'Due date is required';
    } else if (new Date(editInvoice.dueDate) < new Date()) {
      errors.dueDate = 'Due date cannot be in the past';
    }
    
    // Invoice number validation
    if (!editInvoice.invoiceNumber?.trim()) {
      errors.invoiceNumber = 'Invoice number is required';
    }
    
    // Items validation
    if (!editInvoice.items || editInvoice.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      editInvoice.items.forEach((item, index) => {
        if (!item.description?.trim()) {
          errors[`item${index}Description`] = 'Item description is required';
        }
        if (item.quantity <= 0) {
          errors[`item${index}Quantity`] = 'Quantity must be greater than 0';
        }
        if (item.rate < 0) {
          errors[`item${index}Rate`] = 'Rate cannot be negative';
        }
        if (item.taxRate < 0 || item.taxRate > 100) {
          errors[`item${index}TaxRate`] = 'Tax rate must be between 0 and 100';
        }
      });
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle update invoice
  const handleUpdateInvoice = async () => {
    if (!selectedInvoice || !editInvoice) return;
    
    // Validate form before submission
    if (!validateEditInvoice()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }
    
    try {
      setSubmitting(true);
      setValidationErrors({});
      
      // DEBUG: Log the notes, terms, and termsAndConditions field values
      console.log('Notes field value before updating:', editInvoice.notes);
      console.log('Terms field value before updating:', editInvoice.terms);
      console.log('Terms and Conditions field value before updating:', editInvoice.termsAndConditions);
      
      const invoiceData = {
        ...editInvoice,
        totalAmount: handleEditCalculateTotal(),
        currency: editInvoice.currency,
        // Explicitly ensure notes and termsAndConditions fields are included
        notes: editInvoice.notes || '',
        termsAndConditions: editInvoice.termsAndConditions || getDefaultTermsAndConditions(),
      };
      if (typeof invoiceData.projectId !== 'undefined' && !invoiceData.projectId) {
        delete invoiceData.projectId;
      }
      console.log('Updating invoice with data:', invoiceData);
      console.log('Notes in invoice data:', invoiceData.notes);
      console.log('Terms in invoice data:', invoiceData.terms);
      console.log('Terms and Conditions in invoice data:', invoiceData.termsAndConditions);
      
      const result = await apiPut(`/invoices/${selectedInvoice._id}`, invoiceData);
      console.log('Update result:', result);
      
      // DEBUG: Log the notes, terms, and termsAndConditions fields in the response
      if (result && result.data && result.data.invoice) {
        console.log('Notes in update response:', result.data.invoice.notes);
        console.log('Terms in update response:', result.data.invoice.terms);
        console.log('Terms and Conditions in update response:', result.data.invoice.termsAndConditions);
      } else if (result && result.notes) {
        console.log('Notes in update response:', result.notes);
        console.log('Terms in update response:', result.terms);
        console.log('Terms and Conditions in update response:', result.termsAndConditions);
      }
      dispatch(fetchInvoices({ page, limit }));
      setShowEditModal(false);
      setSelectedInvoice(null);
      setEditInvoice(null);
      toast.success(<span>Invoice updated! <a href="#" onClick={() => handleViewInvoice(result.data.invoice)} className="underline text-blue-600 ml-2">View</a> <a href="#" onClick={() => handleDownloadPDF(result.data.invoice)} className="underline text-green-600 ml-2">Download</a></span>);
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      if (error.response?.data?.error?.details) {
        // Handle validation errors from backend
        const backendErrors = error.response.data.error.details;
        const formattedErrors: {[key: string]: string} = {};
        backendErrors.forEach((err: any) => {
          formattedErrors[err.path || err.param] = err.msg;
        });
        setValidationErrors(formattedErrors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error('Error updating invoice: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Add this function to generate next invoice number
  const generateNextInvoiceNumber = async () => {
    try {
      const res = await apiGet('/invoices/next-number');
      if (res && res.data && res.data.invoiceNumber) {
        return res.data.invoiceNumber;
      }
      return `INV-${Date.now()}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return `INV-${Date.now()}`;
    }
  };

  // Handler for duplicating an invoice
  const handleDuplicateInvoice = async (invoice: Invoice) => {
    try {
      // Generate a new invoice number
      const nextNumber = await generateNextInvoiceNumber();
      
      // Set up the new invoice with duplicated data
      const duplicatedInvoice = {
        invoiceNumber: nextNumber,
        clientId: invoice.client && (invoice.client as any)._id ? (invoice.client as any)._id : '',
        projectId: invoice.project && (invoice.project as any)._id ? (invoice.project as any)._id : '',
        dueDate: '', // Clear due date for new invoice
        items: invoice.items ? invoice.items.map((item: any) => ({ 
          description: item.description || '', 
          quantity: item.quantity || 1, 
          rate: item.rate || 0, 
          amount: item.amount || 0, 
          taxRate: item.taxRate || 0, 
          note: item.note || '' 
        })) : [{ description: '', quantity: 1, rate: 0, amount: 0, taxRate: 0, note: '' }],
        currency: invoice.currency || 'INR',
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        termsAndConditions: (invoice as any).termsAndConditions || getDefaultTermsAndConditions(),
      };

      setNewInvoice(duplicatedInvoice);
      setShowAddModal(true);
      
      toast.success(`Invoice duplicated! New invoice #${nextNumber} ready for editing.`, {
        duration: 4000,
        icon: '📄',
      });
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      toast.error('Failed to duplicate invoice. Please try again.');
    }
  };

  // Handler for sending an invoice via email
  const handleSendInvoice = async (invoice: Invoice) => {
    const clientEmail = invoice.client?.contactPerson?.email;
    
    if (!clientEmail) {
      toast.error('No email address found for this client. Please update the client information.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Here you would typically call your email API
      // For now, we'll simulate the functionality and show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success(`Invoice #${invoice.invoiceNumber} sent to ${clientEmail}!`, {
        duration: 4000,
        icon: '📧',
      });
      
      // Update invoice status to 'sent' if currently 'draft'
      if (invoice.status === 'draft') {
        try {
          await apiPut(`/invoices/${invoice._id}`, {
            ...invoice,
            status: 'sent'
          });
          dispatch(fetchInvoices({ page, limit }));
        } catch (updateError) {
          console.error('Error updating invoice status:', updateError);
        }
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add useEffect for keyboard escape handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showViewModal) setShowViewModal(false);
        if (showEditModal) handleCloseEditModal();
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
        { description: '', quantity: 1, rate: 0, amount: 0, taxRate: 0, note: '' },
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

  // Add this useEffect for add invoice modal:
  useEffect(() => {
    if (!showAddModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') { addItem(); e.preventDefault(); }
      if (e.ctrlKey && (e.key === 'Backspace' || e.key === 'Delete')) { if (newInvoice.items.length > 1) removeItem(newInvoice.items.length - 1); e.preventDefault(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showAddModal, newInvoice.items]);

  // Add this useEffect for edit invoice modal:
  useEffect(() => {
    if (!showEditModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') { handleUpdateInvoice(); e.preventDefault(); }
      if (e.ctrlKey && e.key === 'N') { handleEditAddItem(); e.preventDefault(); }
      if (e.ctrlKey && (e.key === 'Backspace' || e.key === 'Delete')) { if (editInvoice && editInvoice.items.length > 1) handleEditRemoveItem(editInvoice.items.length - 1); e.preventDefault(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showEditModal, editInvoice && editInvoice.items]);

  // Configure drag sensors with small activation distance to avoid interfering with input editing
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  // Create a SortableItem that exposes drag handle props
  function SortableItem({ id, children }: { id: string, children: (params: { attributes: any; listeners: any; setNodeRef: (node: HTMLElement | null) => void; isDragging: boolean; style: React.CSSProperties; }) => React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.7 : 1,
    };
    return (
      <>{children({ attributes, listeners, setNodeRef, isDragging, style })}</>
    );
  }

  // Add these handlers above the return statement:
  const handleAddItemsDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setNewInvoice(prev => {
        const oldIndex = Number(active.id);
        const newIndex = Number(over.id);
        const newItems = arrayMove(prev.items, oldIndex, newIndex);
        return { ...prev, items: newItems };
      });
    }
  };
  const handleEditItemsDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setEditInvoice((prev: any) => {
        const oldIndex = Number(active.id);
        const newIndex = Number(over.id);
        const newItems = arrayMove(prev.items, oldIndex, newIndex);
        return { ...prev, items: newItems };
      });
    }
  };

  // 1. Wrap setNewInvoice and setEditInvoice to push previous state to undoStack/undoStackEdit and clear redoStack/redoStackEdit
  const updateNewInvoice = (updater: (prev: any) => any) => {
    setUndoStack((prev) => [...prev, newInvoice]);
    setRedoStack([]);
    setNewInvoice(updater);
  };
  const updateEditInvoice = (updater: (prev: any) => any) => {
    setUndoStackEdit((prev) => [...prev, editInvoice]);
    setRedoStackEdit([]);
    setEditInvoice(updater);
  };
  // Replace all setNewInvoice with updateNewInvoice, setEditInvoice with updateEditInvoice in form handlers.
  // 2. Add Undo/Redo buttons near modal titles:
  // <div className="flex items-center gap-2 mb-4">
  //   <h2 className="text-2xl font-bold text-white">Create New Invoice</h2>
  //   <button onClick={undoNewInvoice} disabled={undoStack.length === 0} className="ml-2 px-2 py-1 bg-gray-700 text-white rounded disabled:opacity-50">Undo</button>
  //   <button onClick={redoNewInvoice} disabled={redoStack.length === 0} className="px-2 py-1 bg-gray-700 text-white rounded disabled:opacity-50">Redo</button>
  // </div>
  // Repeat for edit modal.
  // 3. Add undo/redo handlers:
  const undoNewInvoice = () => {
    if (undoStack.length > 0) {
      setRedoStack((prev) => [newInvoice, ...prev]);
      setNewInvoice(undoStack[undoStack.length - 1]);
      setUndoStack(undoStack.slice(0, -1));
    }
  };
  const redoNewInvoice = () => {
    if (redoStack.length > 0) {
      setUndoStack((prev) => [...prev, newInvoice]);
      setNewInvoice(redoStack[0]);
      setRedoStack(redoStack.slice(1));
    }
  };
  const undoEditInvoice = () => {
    if (editInvoiceHistoryIndex > 0) {
      setEditInvoiceHistoryIndex(editInvoiceHistoryIndex - 1);
      setEditInvoice(editInvoiceHistory[editInvoiceHistoryIndex - 1]);
    }
  };
  const redoEditInvoice = () => {
    if (editInvoiceHistoryIndex < editInvoiceHistory.length - 1) {
      setEditInvoiceHistoryIndex(editInvoiceHistoryIndex + 1);
      setEditInvoice(editInvoiceHistory[editInvoiceHistoryIndex + 1]);
    }
  };

  // Helper function to format color key names
  const formatColorKey = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').trim();
  };
  // 4. Add useEffect for keyboard shortcuts for both modals.

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Invoices</h1>
              <p className="text-gray-300 mt-2">Manage your invoices and track payments</p>
              {/* Debug info */}
              <div className="mt-2 text-sm text-gray-400">
                <p>Total Revenue: {formatCurrency(totalRevenue)}</p>
                <p>Debug: {clients.length} clients loaded</p>
                <button
                  onClick={() => {
                    console.log('Debug: Current clients state:', clients);
                    fetchClients();
                  }}
                  className="mt-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs"
                >
                  Test Fetch Clients
                </button>
              </div>
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
                className="btn btn-primary group" 
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                New Invoice
              </button>
              <button
                className="btn btn-outline group"
                onClick={() => setShowCustomizer(true)}
              >
                <Palette className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                Customize
              </button>
              <button
                className="btn btn-outline group"
                onClick={() => setShowDraftManager(true)}
              >
                <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Drafts
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
          <div 
            className="bg-gray-900 rounded-xl p-8 w-full max-w-4xl shadow-lg relative mx-4 my-8 border border-gray-700 modal-content max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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
            <h2 className="text-2xl font-bold mb-8 text-white">Create New Invoice</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {/* Client Details Section */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <label className="block text-sm font-medium text-gray-300 mr-3">Client *</label>
                    <select
                      value={showNewClientFields ? '' : newInvoice.clientId}
                      onChange={(e) => {
                        setShowNewClientFields(false);
                        setNewInvoice({ ...newInvoice, clientId: e.target.value, projectId: '' });
                      }}
                      className="px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white flex-1"
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>{client.companyName}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ml-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
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

                {/* Invoice Details Section */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-400" />
                    Invoice Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Invoice Number</label>
                      <input
                        type="text"
                        value={newInvoice.invoiceNumber}
                        onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Due Date *</label>
                      <input
                        type="date"
                        value={newInvoice.dueDate}
                        onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Project (Optional)</label>
                      <select
                        value={newInvoice.projectId}
                        onChange={(e) => setNewInvoice({ ...newInvoice, projectId: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      >
                        <option value="">Select a project</option>
                        {getFilteredProjects().map((project: any) => (
                          <option key={project._id} value={project._id}>{project.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Currency</label>
                      <select
                        value={newInvoice.currency}
                        onChange={(e) => setNewInvoice({ ...newInvoice, currency: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="AUD">AUD (A$)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Invoice Items Section */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Package className="h-5 w-5 mr-2 text-green-400" />
                      Invoice Items
                    </h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Item</span>
                    </button>
                  </div>
                  
                  <DndContext collisionDetection={closestCenter} onDragEnd={handleAddItemsDragEnd} sensors={sensors}>
                    <SortableContext items={newInvoice.items.map((_, index) => index.toString())} strategy={verticalListSortingStrategy}>
                      {newInvoice.items.map((item, index) => (
                        <SortableItem key={index} id={index.toString()}>
                          {({ attributes, listeners, setNodeRef, style }) => (
                            <div ref={setNodeRef} style={style} className="bg-gray-700 rounded-lg p-6 mb-6 border border-gray-600">
                              <div className="flex justify-between items-center mb-6">
                                <h4 className="font-medium text-gray-200 flex items-center">
                                  <button type="button" className="p-2 mr-3 text-gray-400 hover:text-gray-300 cursor-grab transition-colors" aria-label="Reorder item" {...attributes} {...listeners}>
                                    <GripVertical className="h-4 w-4" />
                                  </button>
                                  Item {index + 1}
                                </h4>
                                {newInvoice.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-400 hover:text-red-300 p-2 rounded transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                                <div className="lg:col-span-3">
                                  <label className="block text-sm font-medium text-gray-400 mb-2">Description *</label>
                                  <textarea
                                    value={item.description}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                                    placeholder="Enter detailed item description..."
                                    rows={3}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-2">Quantity *</label>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                    min="0.01"
                                    step="0.01"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-2">Rate *</label>
                                  <input
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-2">Tax %</label>
                                  <input
                                    type="number"
                                    value={item.taxRate || 0}
                                    onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
                                  <div className="px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 text-center font-medium">
                                    {formatCurrency(item.amount, newInvoice.currency)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Notes (Optional)</label>
                                <textarea
                                  value={item.note || ''}
                                  onChange={(e) => updateItem(index, 'note', e.target.value)}
                                  className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                                  placeholder="Additional notes for this item..."
                                  rows={2}
                                />
                              </div>
                            </div>
                          )}
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>

                  {/* Total */}
                  <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        Total: {formatCurrency(calculateTotal(), newInvoice.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-purple-400" />
                    Additional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Payment Terms</label>
                      <textarea
                        value={newInvoice.terms}
                        onChange={(e) => setNewInvoice({ ...newInvoice, terms: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        rows={4}
                        placeholder="Enter payment terms..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                      <textarea
                        value={newInvoice.notes}
                        onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        rows={4}
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Terms & Conditions</label>
                    <textarea
                      value={newInvoice.termsAndConditions}
                      onChange={(e) => setNewInvoice({ ...newInvoice, termsAndConditions: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      rows={6}
                      placeholder="Enter terms and conditions for this invoice..."
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Live Preview</h3>
                <div className="invoice-preview-container">
                  <InvoicePreview
                    invoice={{
                      ...newInvoice,
                      items: newInvoice.items,
                      subtotal: calculateTotal(),
                      totalAmount: calculateTotal(),
                      dueDate: newInvoice.dueDate || new Date().toISOString(),
                      status: 'draft',
                      createdAt: new Date().toISOString(),
                      _id: 'preview',
                      client: clients.find(c => c._id === newInvoice.clientId) || { companyName: '', contactPerson: { firstName: '', lastName: '', email: '' }, address: { street: '', city: '', state: '', zipCode: '', country: '' } },
                      project: projects.find(p => p._id === newInvoice.projectId),
                      currency: newInvoice.currency || 'INR'
                    }}
                    customization={invoiceCustomization}
                    template={defaultTemplates.find(t => t.id === invoiceCustomization.template) || defaultTemplates[0]}
                    isPreview={true}
                    showClientAddress={showClientAddress}
                  />
                </div>
              </div>
            </div>
            {/* Sticky action buttons remain outside the grid */}
            <div className="sticky bottom-0 bg-gray-900 z-20 pt-4 pb-4 border-t border-gray-700 flex justify-end space-x-3">
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
                          {formatColorKey(key)}:
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
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-600 mb-8">
        <div className="flex flex-col gap-4">
          {/* Search Bar - Full width on mobile */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-base"
            />
          </div>
          
          {/* Filters Grid - Responsive layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Status Filter */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-base"
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
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-base"
              placeholder="Filter by date"
            />

            {/* Sort Options */}
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-base sm:col-span-2 lg:col-span-1"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount: High to Low</option>
              <option value="amount-low">Amount: Low to High</option>
              <option value="due-date">By Due Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
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
                        
                        {/* Desktop Actions */}
                        <div className="hidden sm:flex items-center gap-2">
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
                            onClick={() => handleDuplicateInvoice(inv)}
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-600 rounded-lg transition-all"
                            title="Duplicate Invoice"
                          >
                            <Copy size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleSendInvoice(inv)}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-600 rounded-lg transition-all"
                            title="Send Invoice"
                            disabled={submitting}
                          >
                            <Send size={18} />
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
                        </div>

                        {/* Mobile Actions - Primary actions only */}
                        <div className="flex sm:hidden items-center gap-2">
                          <button
                            onClick={() => handleViewInvoice(inv)}
                            className="p-3 text-gray-400 hover:text-green-400 hover:bg-gray-600 rounded-lg transition-all touch-target"
                            title="View Invoice"
                          >
                            <Eye size={20} />
                          </button>
                          
                          <button
                            onClick={() => handleEditInvoice(inv)}
                            className="p-3 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded-lg transition-all touch-target"
                            title="Edit Invoice"
                          >
                            <Edit size={20} />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentData(prev => ({ ...prev, amount: inv.totalAmount }));
                              setShowPaymentModal(true);
                            }}
                            className="p-3 text-gray-400 hover:text-yellow-400 hover:bg-gray-600 rounded-lg transition-all touch-target"
                            title="Update Payment"
                          >
                            <DollarSign size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile-only sections - Enhanced layout */}
                    <div className="sm:hidden mt-4 pt-4 border-t border-gray-600">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-gray-400 text-sm">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                          <p className="text-gray-500 text-xs mt-1">{inv.client?.companyName || 'Unknown Client'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white text-lg">{formatCurrency(inv.totalAmount || 0, inv.currency)}</p>
                        </div>
                      </div>
                      
                      {/* Mobile Quick Actions Row */}
                      <div className="flex justify-center gap-4 mt-3">
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm"
                        >
                          <Download size={16} />
                          <span>Download</span>
                        </button>
                        
                        <button
                          onClick={() => handleDuplicateInvoice(inv)}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all text-sm"
                        >
                          <Copy size={16} />
                          <span>Duplicate</span>
                        </button>
                        
                        <button
                          onClick={() => handleSendInvoice(inv)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all text-sm"
                          disabled={submitting}
                        >
                          <Send size={16} />
                          <span>Send</span>
                        </button>
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

      {/* Invoice View Modal - Redesigned */}
      {showViewModal && selectedInvoice && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowViewModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-7xl shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxHeight: 'calc(100vh - 2rem)',
              marginTop: '1rem',
              marginBottom: '1rem'
            }}
          >
            {/* Fixed Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-lg font-semibold text-blue-600">#{selectedInvoice.invoiceNumber}</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedInvoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        selectedInvoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedInvoice.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setSelectedInvoice(selectedInvoice);
                      setShowViewModal(false);
                      handleEditInvoice(selectedInvoice);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(selectedInvoice)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Download PDF</span>
                  </button>
                  <button 
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" 
                    onClick={() => setShowViewModal(false)}
                    type="button"
                    title="Close (ESC)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="modal-invoice-preview">
              <div className="p-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="invoice-preview-container">
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
                          taxRate: 0,
                          note: selectedInvoice.notes || ''
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
        </div>
      )}

      {/* Invoice Edit Modal - Redesigned */}
      {showEditModal && selectedInvoice && editInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseEditModal();
            }
          }}
        >
          <div 
            className="bg-gray-900 rounded-2xl w-full max-w-[95vw] shadow-2xl relative overflow-hidden border border-gray-700"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxHeight: 'calc(100vh - 2rem)',
              marginTop: '1rem',
              marginBottom: '1rem'
            }}
          >
            {/* Fixed Header */}
            <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    Edit Invoice
                    {hasUnsavedChanges && (
                      <span className="ml-2 px-2 py-1 bg-yellow-600 text-white text-xs rounded-full animate-pulse">
                        Unsaved Changes
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-400 mt-1">#{editInvoice.invoiceNumber}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Undo/Redo buttons */}
                  <div className="flex items-center space-x-1 border border-gray-600 rounded-lg p-1">
                    <button
                      onClick={undoEditInvoice}
                      disabled={editInvoiceHistoryIndex === 0}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo size={16} />
                    </button>
                    <button
                      onClick={redoEditInvoice}
                      disabled={editInvoiceHistoryIndex === editInvoiceHistory.length - 1}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo size={16} />
                    </button>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-white text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors" 
                    onClick={handleCloseEditModal}
                    type="button"
                    title="Close (ESC)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex h-full">
              {/* Left Side - Form (scrollable) */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
                <div className="p-6 space-y-8">
                  {/* Basic Information */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-400" />
                      Invoice Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Client *</label>
                        <select
                          value={editInvoice.clientId}
                          onChange={(e) => setEditInvoice({ ...editInvoice, clientId: e.target.value, projectId: '' })}
                          className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 text-white ${
                            validationErrors.clientId 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-gray-600 focus:ring-blue-500'
                          }`}
                          required
                        >
                          <option value="">Select a client</option>
                          {clients.map((client) => (
                            <option key={client._id} value={client._id}>{client.companyName}</option>
                          ))}
                        </select>
                        {validationErrors.clientId && (
                          <p className="text-red-400 text-sm mt-1">{validationErrors.clientId}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Project (Optional)</label>
                        <select
                          value={editInvoice.projectId}
                          onChange={(e) => setEditInvoice({ ...editInvoice, projectId: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                          disabled={!editInvoice.clientId}
                        >
                          <option value="">Select a project (optional)</option>
                          {getFilteredProjects().map((project) => (
                            <option key={project._id} value={project._id}>{project.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Number</label>
                        <input
                          type="text"
                          value={editInvoice.invoiceNumber}
                          onChange={(e) => setEditInvoice({ ...editInvoice, invoiceNumber: e.target.value })}
                          className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 text-white ${
                            validationErrors.invoiceNumber 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-gray-600 focus:ring-blue-500'
                          }`}
                          placeholder="Enter invoice number"
                        />
                        {validationErrors.invoiceNumber && (
                          <p className="text-red-400 text-sm mt-1">{validationErrors.invoiceNumber}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Due Date *</label>
                        <input
                          type="date"
                          value={editInvoice.dueDate}
                          onChange={(e) => setEditInvoice({ ...editInvoice, dueDate: e.target.value })}
                          className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 text-white ${
                            validationErrors.dueDate 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-gray-600 focus:ring-blue-500'
                          }`}
                          required
                        />
                        {validationErrors.dueDate && (
                          <p className="text-red-400 text-sm mt-1">{validationErrors.dueDate}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                        <select
                          value={editInvoice.currency}
                          onChange={(e) => setEditInvoice({ ...editInvoice, currency: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
                  </div>

                  {/* Invoice Items */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Package className="h-5 w-5 mr-2 text-green-400" />
                        Invoice Items
                      </h3>
                      <button
                        type="button"
                        onClick={handleEditAddItem}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <DndContext collisionDetection={closestCenter} onDragEnd={handleEditItemsDragEnd} sensors={sensors}>
                        <SortableContext items={editInvoice.items.map((_: InvoiceItem, i: number) => i.toString())} strategy={verticalListSortingStrategy}>
                          {editInvoice.items.map((item, index) => (
                            <SortableItem key={index} id={index.toString()}>
                              {({ attributes, listeners, setNodeRef, style }) => (
                                <div ref={setNodeRef} style={style} className="bg-gray-700 rounded-lg p-6 mb-6 border border-gray-600">
                                  <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-medium text-gray-200 flex items-center">
                                      <button type="button" className="p-2 mr-3 text-gray-400 hover:text-gray-300 cursor-grab transition-colors" aria-label="Reorder item" {...attributes} {...listeners}>
                                        <GripVertical className="h-4 w-4" />
                                      </button>
                                      Item {index + 1}
                                    </h4>
                                    {editInvoice.items.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleEditRemoveItem(index)}
                                        className="text-red-400 hover:text-red-300 p-2 rounded transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    <div className="lg:col-span-5">
                                      <label className="block text-sm font-medium text-gray-400 mb-2">Description *</label>
                                      <textarea
                                        value={item.description}
                                        onChange={(e) => handleEditItem(index, 'description', e.target.value)}
                                        className={`w-full px-3 py-3 bg-gray-600 border rounded-lg focus:outline-none focus:ring-2 text-white resize-none ${
                                          validationErrors[`item${index}Description`] 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-500 focus:ring-blue-500'
                                        }`}
                                        placeholder="Enter detailed item description..."
                                        rows={3}
                                        required
                                      />
                                      {validationErrors[`item${index}Description`] && (
                                        <p className="text-red-400 text-xs mt-1">{validationErrors[`item${index}Description`]}</p>
                                      )}
                                    </div>
                                    
                                    <div className="lg:col-span-2">
                                      <label className="block text-sm font-medium text-gray-400 mb-2">Quantity *</label>
                                      <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleEditItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                        min="0.01"
                                        step="0.01"
                                        required
                                      />
                                    </div>
                                    
                                    <div className="lg:col-span-2">
                                      <label className="block text-sm font-medium text-gray-400 mb-2">Rate *</label>
                                      <input
                                        type="number"
                                        value={item.rate}
                                        onChange={(e) => handleEditItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                        min="0"
                                        step="0.01"
                                        required
                                      />
                                    </div>
                                    
                                    <div className="lg:col-span-2">
                                      <label className="block text-sm font-medium text-gray-400 mb-2">Tax %</label>
                                      <input
                                        type="number"
                                        value={item.taxRate || 0}
                                        onChange={(e) => handleEditItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                      />
                                    </div>
                                    
                                    <div className="lg:col-span-1">
                                      <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
                                      <div className="px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 text-center font-medium text-sm">
                                        {formatCurrency(item.amount, editInvoice.currency)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Item Note */}
                                  <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Notes (Optional)</label>
                                    <textarea
                                      value={item.note || ''}
                                      onChange={(e) => handleEditItem(index, 'note', e.target.value)}
                                      className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                      rows={2}
                                      placeholder="Add notes for this item..."
                                    />
                                  </div>
                                </div>
                              )}
                            </SortableItem>
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>

                    {/* Total */}
                    <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          Total: {formatCurrency(handleEditCalculateTotal(), editInvoice.currency)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes and Terms */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-purple-400" />
                      Additional Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Payment Terms</label>
                        <textarea
                          value={editInvoice.terms}
                          onChange={(e) => setEditInvoice({ ...editInvoice, terms: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                          rows={4}
                          placeholder="Enter payment terms..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                        <textarea
                          value={editInvoice.notes}
                          onChange={(e) => setEditInvoice({ ...editInvoice, notes: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                          rows={4}
                          placeholder="Add any additional notes..."
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Terms & Conditions</label>
                      <textarea
                        value={editInvoice.termsAndConditions}
                        onChange={(e) => setEditInvoice({ ...editInvoice, termsAndConditions: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        rows={6}
                        placeholder="Enter terms and conditions for this invoice..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Live Preview */}
              <div className="w-1/2 border-l border-gray-700 modal-invoice-preview">
                <div className="p-6">
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-blue-600" />
                      Live Preview
                    </h3>
                    <div className="invoice-preview-container">
                      <InvoicePreview
                        invoice={{
                          ...editInvoice,
                          items: editInvoice.items,
                          subtotal: handleEditCalculateTotal(),
                          totalAmount: handleEditCalculateTotal(),
                          dueDate: editInvoice.dueDate || new Date().toISOString(),
                          status: editInvoice.status || 'draft',
                          createdAt: editInvoice.createdAt || new Date().toISOString(),
                          _id: 'preview',
                          client: clients.find(c => c._id === editInvoice.clientId) || { 
                            companyName: '', 
                            contactPerson: { firstName: '', lastName: '', email: '' }, 
                            address: { street: '', city: '', state: '', zipCode: '', country: '' } 
                          },
                          project: projects.find(p => p._id === editInvoice.projectId),
                        }}
                        customization={Object.assign({}, invoiceCustomization, {
                          paymentTermsText: editInvoice.terms || getDefaultPaymentTerms(),
                          termsAndConditions: getDefaultTermsAndConditions(),
                          currency: editInvoice.currency || 'INR',
                        }) as InvoiceCustomization}
                        template={defaultTemplates.find(t => t.id === invoiceCustomization.template) || defaultTemplates[0]}
                        showClientAddress={showClientAddress}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer with Actions */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-6 py-4 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {hasUnsavedChanges && (
                    <span className="inline-flex items-center mr-4">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></div>
                      Unsaved changes
                    </span>
                  )}
                  Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> to save • <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+N</kbd> to add item • <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Esc</kbd> to cancel
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCloseEditModal}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateInvoice}
                    disabled={submitting}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 font-semibold shadow-lg"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
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

      {/* Draft Manager */}
      <DraftManager
        isOpen={showDraftManager}
        onClose={() => setShowDraftManager(false)}
        onRestoreDraft={(draftData) => {
          setNewInvoice(draftData);
          setShowAddModal(true);
          setShowDraftManager(false);
          toast.success('Draft restored successfully!');
        }}
      />

      <Toaster position="top-right" />
    </div>
  );
};

export default InvoicesPage; 