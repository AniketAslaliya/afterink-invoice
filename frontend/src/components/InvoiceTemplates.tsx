import React from 'react';
import { Check, Star, Crown, Zap, Leaf, Anchor } from 'lucide-react';

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  isPremium?: boolean;
  isNew?: boolean;
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
  }>;
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  notes?: string;
  terms?: string;
  createdAt: string;
}

export const defaultTemplates: InvoiceTemplate[] = [
  {
    id: 'indian-professional',
    name: 'Indian Professional',
    description: 'Perfect for Indian businesses with INR focus',
    preview: '/templates/indian-professional.png',
    isNew: false,
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
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ 
  invoice, 
  customization, 
  template,
  isPreview = false 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: customization.currency || 'USD'
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

  const headerClass = template.layout.headerStyle === 'bold' 
    ? 'border-b-4 pb-6 mb-8' 
    : template.layout.headerStyle === 'creative'
    ? 'relative overflow-hidden pb-8 mb-8'
    : 'border-b pb-6 mb-8';

  const tableClass = template.layout.tableStyle === 'bordered'
    ? 'border border-gray-300'
    : template.layout.tableStyle === 'modern'
    ? 'rounded-lg overflow-hidden shadow-sm'
    : '';

  return (
    <div 
      className={`max-w-4xl mx-auto p-8 ${isPreview ? 'scale-75 transform-gpu' : ''}`}
      style={{ 
        fontFamily: template.fonts.body,
        color: customization.colors.text,
        backgroundColor: customization.colors.background 
      }}
    >
      {/* Header */}
      <div 
        className={headerClass}
        style={{ borderColor: customization.colors.primary }}
      >
        {template.layout.headerStyle === 'creative' && (
          <div 
            className="absolute top-0 right-0 w-32 h-32 opacity-10"
            style={{ backgroundColor: customization.colors.accent }}
          />
        )}
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            {customization.showLogo && customization.companyLogo && (
              <img 
                src={customization.companyLogo} 
                alt="Company Logo"
                className="h-16 w-auto mb-4"
              />
            )}
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ 
                fontFamily: template.fonts.heading,
                color: customization.colors.primary 
              }}
            >
              {customization.companyName}
            </h1>
            {customization.showCompanyDetails && (
              <div className="text-sm space-y-1" style={{ color: customization.colors.secondary }}>
                <p>{customization.companyAddress}</p>
                <p>{customization.companyPhone} • {customization.companyEmail}</p>
                {customization.companyWebsite && <p>{customization.companyWebsite}</p>}
              </div>
            )}
          </div>
          
          <div className="text-right">
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ 
                fontFamily: template.fonts.heading,
                color: customization.colors.primary 
              }}
            >
              INVOICE
            </h2>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-medium">Date:</span> {formatDate(invoice.createdAt)}</p>
              <p><span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}</p>
              <p>
                <span 
                  className="inline-block px-2 py-1 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: invoice.status === 'paid' ? '#10b981' : invoice.status === 'pending' ? '#f59e0b' : '#ef4444',
                    color: 'white'
                  }}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-8">
        <h3 
          className="text-lg font-semibold mb-3"
          style={{ color: customization.colors.primary }}
        >
          Bill To:
        </h3>
        <div>
          <p className="font-medium text-lg">{invoice.client.companyName}</p>
          <p>{invoice.client.contactPerson.firstName} {invoice.client.contactPerson.lastName}</p>
          <p className="text-sm" style={{ color: customization.colors.secondary }}>
            {invoice.client.contactPerson.email}
          </p>
          {invoice.client.address && (
            <div className="mt-2 text-sm" style={{ color: customization.colors.secondary }}>
              <p>{invoice.client.address.street}</p>
              <p>
                {invoice.client.address.city}, {invoice.client.address.state} {invoice.client.address.zipCode}
              </p>
              <p>{invoice.client.address.country}</p>
            </div>
          )}
        </div>
        {invoice.project && (
          <div className="mt-4">
            <span className="font-medium">Project: </span>
            <span style={{ color: customization.colors.secondary }}>{invoice.project.name}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className={`mb-8 ${tableClass}`}>
        <table className="w-full">
          <thead>
            <tr 
              className="text-left"
              style={{ backgroundColor: customization.colors.accent }}
            >
              <th className="p-3 font-medium">Description</th>
              <th className="p-3 font-medium text-center">Qty</th>
              <th className="p-3 font-medium text-right">Rate</th>
              <th className="p-3 font-medium text-right">Tax</th>
              <th className="p-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr 
                key={index} 
                className={`border-b ${template.layout.tableStyle === 'bordered' ? 'border-gray-300' : 'border-gray-100'}`}
              >
                <td className="p-3">{item.description}</td>
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
      <div className="flex justify-end mb-8">
        <div className="w-64">
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
            style={{ 
              borderColor: customization.colors.primary,
              color: customization.colors.primary 
            }}
          >
            <span>Total:</span>
            <span>{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="space-y-6">
        {invoice.notes && (
          <div>
            <h4 className="font-medium mb-2" style={{ color: customization.colors.primary }}>
              Notes:
            </h4>
            <p className="text-sm" style={{ color: customization.colors.secondary }}>
              {invoice.notes}
            </p>
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
      </div>

      {/* Footer */}
      {template.layout.footerStyle !== 'simple' && (
        <div 
          className="mt-12 pt-6 border-t text-center"
          style={{ borderColor: customization.colors.accent }}
        >
          {template.layout.footerStyle === 'branded' && (
            <div className="mb-4">
              <p 
                className="font-medium"
                style={{ color: customization.colors.primary }}
              >
                Thank you for your business!
              </p>
            </div>
          )}
          
          <div className="text-sm" style={{ color: customization.colors.secondary }}>
            {customization.footerText && (
              <p className="mb-2">{customization.footerText}</p>
            )}
            {template.layout.footerStyle === 'detailed' && (
              <p>
                {customization.companyName} • {customization.companyPhone} • {customization.companyEmail}
                {customization.companyWebsite && ` • ${customization.companyWebsite}`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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