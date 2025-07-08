import React, { useRef } from 'react';
import { Check, Crown, Zap } from 'lucide-react';
import './invoice-a4.css';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  isPremium?: boolean;
  isNew?: boolean;
  layout?: {
    headerStyle?: string;
    tableStyle?: string;
    footerStyle?: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  features: string[];
}

export interface InvoiceCustomization {
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
  showPaymentTerms: boolean;
  paymentTermsText: string;
  footerText: string;
  currency: string;
  dateFormat: string;
  termsAndConditions?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: {
    companyName: string;
    contactPerson: {
      firstName: string;
      lastName: string;
      email: string;
    };
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  project?: {
    name: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxRate?: number;
    note?: string;
  }>;
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  currency?: string;
}

export const defaultTemplates: InvoiceTemplate[] = [
  {
    id: 'indian-professional',
    name: 'Indian Professional',
    description: 'Perfect for Indian businesses with INR focus',
    preview: '/templates/indian-professional.png',
    isNew: false,
    layout: {
      headerStyle: 'bold',
      tableStyle: 'bordered',
      footerStyle: 'simple'
    },
    colors: {
      primary: '#FF6B35',
      secondary: '#1A365D',
      accent: '#F7931E',
      text: '#2D3748',
      background: '#FFFFFF'
    },
    fonts: {
      heading: 'Poppins',
      body: 'Inter'
    },
    features: ['GST Compliant', 'INR Optimized', 'Professional Layout']
  },
  {
    id: 'elegant-blue',
    name: 'Elegant Blue',
    description: 'Sophisticated design with blue theme',
    preview: '/templates/elegant-blue.png',
    layout: {
      headerStyle: 'simple',
      tableStyle: 'modern',
      footerStyle: 'simple'
    },
    colors: {
      primary: '#2563EB',
      secondary: '#1E40AF',
      accent: '#60A5FA',
      text: '#1F2937',
      background: '#FFFFFF'
    },
    fonts: {
      heading: 'Merriweather',
      body: 'Inter'
    },
    features: ['Corporate Style', 'Modern Typography', 'Clean Layout']
  },
  {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    description: 'Modern design with gradient elements',
    preview: '/templates/creative-gradient.png',
    isPremium: true,
    colors: {
      primary: '#7C3AED',
      secondary: '#5B21B6',
      accent: '#A855F7',
      text: '#374151',
      background: '#FFFFFF'
    },
    fonts: {
      heading: 'Roboto',
      body: 'Open Sans'
    },
    features: ['Gradient Design', 'Creative Layout', 'Modern Appeal']
  },
  {
    id: 'minimalist-green',
    name: 'Minimalist Green',
    description: 'Fresh and clean with green accents',
    preview: '/templates/minimalist-green.png',
    isNew: true,
    colors: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10B981',
      text: '#111827',
      background: '#FFFFFF'
    },
    fonts: {
      heading: 'Source Sans Pro',
      body: 'Inter'
    },
    features: ['Eco-Friendly', 'Minimalist', 'Clean Design']
  },
  {
    id: 'corporate-navy',
    name: 'Corporate Navy',
    description: 'Traditional business style',
    preview: '/templates/corporate-navy.png',
    colors: {
      primary: '#1E3A8A',
      secondary: '#1E40AF',
      accent: '#3B82F6',
      text: '#1F2937',
      background: '#FFFFFF'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter'
    },
    features: ['Traditional', 'Professional', 'Corporate']
  },
  {
    id: 'modern-tech',
    name: 'Modern Tech',
    description: 'Perfect for tech companies and startups',
    preview: '/templates/modern-tech.png',
    isPremium: true,
    isNew: true,
    colors: {
      primary: '#6366F1',
      secondary: '#4F46E5',
      accent: '#8B5CF6',
      text: '#111827',
      background: '#FFFFFF'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    features: ['Tech Focused', 'Modern', 'Startup Ready']
  }
];

interface InvoicePreviewProps {
  invoice: Invoice;
  customization: InvoiceCustomization;
  template: InvoiceTemplate;
  isPreview?: boolean;
  showClientAddress?: boolean;
}

export const InvoicePreview = React.forwardRef<HTMLDivElement, InvoicePreviewProps>(({
  invoice,
  customization,
  template,
  isPreview = false,
  showClientAddress = true
}, ref) => {
  console.log('Invoice data:', invoice);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Replace dynamic bankDetails and upiString with hardcoded values
  const bankDetails = {
    accountName: 'ASLALIYA ANIKET PARESHBHAI',
    accountNumber: '41497670019',
    ifsc: 'SBIN0018700',
    accountType: 'Savings',
    bankName: 'The State Bank Of India',
    upiId: 'aniketaslaliya@oksbi'
  };
  const upiAmount = invoice.totalAmount || 0;
  const upiString = `upi://pay?pa=aniketaslaliya@oksbi&pn=ASLALIYA%20ANIKET%20PARESHBHAI&am=${upiAmount}&cu=INR`;

  // Determine if client is Indian
  const isIndianClient = customization.currency === 'INR' || (invoice.client.address && invoice.client.address.country?.toLowerCase() === 'india');

  // Format currency: always use INR for Indian clients
  const formatCurrency = (amount: number) => {
    const currency = isIndianClient ? 'INR' : (customization.currency || 'USD');
    const locale = isIndianClient ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (customization.dateFormat) {
      case 'MM/DD/YYYY':
        return date.toLocaleDateString('en-US');
      case 'DD/MM/YYYY':
        return date.toLocaleDateString('en-GB');
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString('en-US');
    }
  };

  const headerClass = template.layout?.headerStyle === 'bold' 
    ? 'border-b-4 pb-6 mb-8' 
    : template.layout?.headerStyle === 'creative'
    ? 'relative overflow-hidden pb-8 mb-8'
    : 'border-b pb-6 mb-8';

  const tableClass = template.layout?.tableStyle === 'bordered'
    ? 'border border-gray-300'
    : template.layout?.tableStyle === 'modern'
    ? 'rounded-lg overflow-hidden shadow-sm'
    : '';

  // A4 size: 210mm x 297mm (convert to px for web: 794px x 1123px at 96dpi)
  const A4_STYLE = {
    width: '794px',
    minHeight: '1123px',
    maxWidth: '794px',
    background: customization.colors.background,
    margin: '0 auto',
    boxShadow: isPreview ? '0 0 0 1px #e5e7eb' : 'none',
    padding: '48px',
    position: 'relative' as 'relative',
    fontFamily: template.fonts.body,
    color: customization.colors.text,
  };

  // Download PDF handler (sticky button)
  const handleDownloadPDF = () => {
    if (!invoiceRef.current) return;
    html2pdf()
      .set({
        margin: 0,
        filename: `${invoice.invoiceNumber || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          ignoreElements: (element: Element) => {
            return element.classList.contains('no-print');
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(invoiceRef.current)
      .save();
  };

  return (
    <>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', padding: '12px 0' }} className="no-print w-full flex justify-end">
        <button onClick={handleDownloadPDF} className="btn btn-primary mb-4">Download PDF</button>
      </div>
      <div 
        ref={ref}
        className={`invoice-a4 max-w-none mx-auto p-0 ${isPreview ? 'scale-75 transform-gpu' : ''}`}
        style={{
          ...A4_STYLE,
          fontFamily: 'Inter, Poppins, Merriweather, Roboto, sans-serif',
          borderRadius: '16px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          padding: '40px',
          background: customization.colors.background,
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2" style={{ borderColor: customization.colors.primary }}>
          <div className="flex flex-col gap-2">
            {customization.showLogo && customization.companyLogo && (
              <img 
                src={customization.companyLogo} 
                alt="Company Logo"
                className="h-16 w-auto mb-2 rounded-lg shadow"
              />
            )}
            <h1 
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: template.fonts.heading, color: customization.colors.primary }}
            >
              {customization.companyName || 'Your Company Name'}
            </h1>
            {customization.showCompanyDetails && (
              <div className="text-sm space-y-1" style={{ color: customization.colors.secondary }}>
                <p>{customization.companyAddress || 'Company Address'}</p>
                <p>{customization.companyPhone || ''} • {customization.companyEmail || ''}</p>
                {customization.companyWebsite && <p>{customization.companyWebsite}</p>}
              </div>
            )}
          </div>
          <div className="text-right flex flex-col gap-2">
            <h2 
              className="text-2xl font-bold mb-2 tracking-wide"
              style={{ fontFamily: template.fonts.heading, color: customization.colors.primary }}
            >
              INVOICE
            </h2>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber || '-'}</p>
              <p><span className="font-medium">Date:</span> {formatDate(invoice.createdAt)}</p>
              <p><span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}</p>
              {isPreview && (
                <p>
                  <span 
                    className="inline-block px-2 py-1 rounded text-xs font-medium no-print"
                    style={{ backgroundColor: invoice.status === 'paid' ? '#10b981' : invoice.status === 'pending' ? '#f59e0b' : '#ef4444', color: 'white' }}
                  >
                    {(invoice.status || 'draft').toUpperCase()}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Project */}
        <div className="flex flex-col md:flex-row md:justify-between gap-8 mb-8">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1" style={{ color: customization.colors.primary }}>Bill To:</h3>
            <div>
              <p className="font-medium text-base">{invoice.client?.companyName || 'Unknown Client'}</p>
              <span className="block text-sm">{invoice.client?.contactPerson?.firstName || ''} {invoice.client?.contactPerson?.lastName || ''}</span>
              <span className="block text-xs" style={{ color: customization.colors.secondary }}>{invoice.client?.contactPerson?.email || ''}</span>
            </div>
          </div>
          {invoice.project && (
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2" style={{ color: customization.colors.primary }}>Project:</h3>
              <span className="text-base" style={{ color: customization.colors.secondary }}>{invoice.project.name}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50" style={{ backgroundColor: customization.colors.accent }}>
                <th className="p-3 font-semibold text-left">Description</th>
                <th className="p-3 font-semibold text-center">Qty</th>
                <th className="p-3 font-semibold text-right">Rate</th>
                <th className="p-3 font-semibold text-right">Tax</th>
                <th className="p-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-3">
                    {item.description}
                    {item.note && (
                      <div className="text-xs text-gray-500 mt-1 italic">{item.note}</div>
                    )}
                  </td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">{formatCurrency(item.rate)}</td>
                  <td className="p-3 text-right">{item.taxRate || 0}%</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end mb-8">
          <div className="w-full md:w-1/2 lg:w-1/3">
            {invoice.subtotal && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
            )}
            {invoice.taxAmount && invoice.taxAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Tax:</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div 
              className="flex justify-between py-3 font-bold text-lg border-t-2"
              style={{ borderColor: customization.colors.primary, color: customization.colors.primary }}
            >
              <span>Total:</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="mb-8">
          <h4 className="font-medium mb-2" style={{ color: customization.colors.primary }}>Payment Details</h4>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Bank Name:</span> {bankDetails.bankName}</p>
            <p><span className="font-medium">Account Name:</span> {bankDetails.accountName}</p>
            <p><span className="font-medium">Account Number:</span> {bankDetails.accountNumber}</p>
            <p><span className="font-medium">IFSC:</span> {bankDetails.ifsc}</p>
            <p><span className="font-medium">UPI ID:</span> {bankDetails.upiId}</p>
          </div>
        </div>

        {/* Notes, Terms, and Footer */}
        <div className="space-y-6">
          {invoice.notes && (
            <div>
              <h4 className="font-medium mb-2" style={{ color: customization.colors.primary }}>
                Notes:
              </h4>
              <div className="text-sm" style={{ color: customization.colors.secondary }}
                dangerouslySetInnerHTML={{ __html: (invoice.notes || '').replace(/\n/g, '<br/>') }}
              />
            </div>
          )}
          {customization.showPaymentTerms && (
            <div>
              <h4 className="font-medium mb-2" style={{ color: customization.colors.primary }}>
                Payment Terms:
              </h4>
              <p className="text-sm" style={{ color: customization.colors.secondary }}>
                {customization.paymentTermsText || invoice.terms || 'Payment is due within 30 days of invoice date.'}
              </p>
            </div>
          )}
          <div>
            <h4 className="font-medium mb-2" style={{ color: customization.colors.primary }}>
              Terms & Conditions:
            </h4>
            <p className="text-sm" style={{ color: customization.colors.secondary }}>
              {customization.termsAndConditions || invoice.terms || 'All services are subject to our standard terms and conditions.'}
            </p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          {customization.footerText || 'Thank you for your business!'}
        </div>
      </div>
    </>
  );
});

interface InvoiceTemplatesProps {
  selectedTemplate: string;
  onTemplateSelect: (template: InvoiceTemplate) => void;
  onClose: () => void;
}

const InvoiceTemplates: React.FC<InvoiceTemplatesProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Choose Your Perfect Template</h2>
              <p className="text-gray-600 mt-2">Select a professional invoice template that matches your brand</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {defaultTemplates.map((template) => (
              <div
                key={template.id}
                className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedTemplate === template.id
                    ? 'ring-4 ring-blue-500 shadow-2xl'
                    : 'hover:shadow-xl'
                }`}
                onClick={() => onTemplateSelect(template)}
              >
                {/* Template Card */}
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                  {/* Preview Image */}
                  <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    {/* Mock Invoice Preview */}
                    <div 
                      className="w-full h-full p-4 bg-white m-2 rounded-lg shadow-sm"
                      style={{ 
                        background: `linear-gradient(135deg, ${template.colors.background} 0%, ${template.colors.primary}10 100%)` 
                      }}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div 
                            className="w-12 h-8 rounded-md mb-2"
                            style={{ backgroundColor: template.colors.primary }}
                          ></div>
                          <div className="space-y-1">
                            <div className="w-20 h-2 bg-gray-300 rounded"></div>
                            <div className="w-16 h-2 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div 
                            className="text-lg font-bold mb-1"
                            style={{ 
                              color: template.colors.primary,
                              fontFamily: template.fonts.heading
                            }}
                          >
                            INVOICE
                          </div>
                          <div className="w-16 h-2 bg-gray-300 rounded ml-auto"></div>
                        </div>
                      </div>

                      {/* Content Lines */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <div className="w-24 h-2 bg-gray-300 rounded"></div>
                          <div className="w-12 h-2 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="w-20 h-2 bg-gray-300 rounded"></div>
                          <div className="w-16 h-2 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="w-28 h-2 bg-gray-300 rounded"></div>
                          <div className="w-14 h-2 bg-gray-200 rounded"></div>
                        </div>
                      </div>

                      {/* Total */}
                      <div 
                        className="w-full h-6 rounded mt-4"
                        style={{ backgroundColor: `${template.colors.primary}20` }}
                      ></div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {template.isPremium && (
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Crown size={12} />
                          Premium
                        </span>
                      )}
                      {template.isNew && (
                        <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Zap size={12} />
                          New
                        </span>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {selectedTemplate === template.id && (
                      <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-2">
                        <Check size={16} />
                      </div>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: template.fonts.heading }}>
                        {template.name}
                      </h3>
                      {selectedTemplate === template.id && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          Selected
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {template.description}
                    </p>

                    {/* Color Palette */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-medium text-gray-500 mr-2">Colors:</span>
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: template.colors.primary }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: template.colors.secondary }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: template.colors.accent }}
                        ></div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {template.features.map((feature, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-12 pt-8 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              Use Selected Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplates; 