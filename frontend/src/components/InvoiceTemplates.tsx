import React from 'react';

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
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
  layout: {
    headerStyle: 'minimal' | 'bold' | 'creative';
    tableStyle: 'clean' | 'bordered' | 'modern';
    footerStyle: 'simple' | 'detailed' | 'branded';
  };
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
    description: 'Modern design optimized for Indian businesses with elegant styling',
    preview: '🇮🇳 Professional Indian business template with modern aesthetics',
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
    layout: {
      headerStyle: 'bold',
      tableStyle: 'modern',
      footerStyle: 'detailed'
    }
  },
  {
    id: 'elegant-blue',
    name: 'Elegant Blue',
    description: 'Sophisticated blue theme with clean typography',
    preview: '💙 Clean and professional with sophisticated blue accents',
    colors: {
      primary: '#1565c0',
      secondary: '#42a5f5',
      text: '#263238',
      background: '#ffffff',
      accent: '#e3f2fd'
    },
    fonts: {
      heading: 'Merriweather, serif',
      body: 'Open Sans, sans-serif'
    },
    layout: {
      headerStyle: 'minimal',
      tableStyle: 'clean',
      footerStyle: 'simple'
    }
  },
  {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    description: 'Modern gradient design with creative elements',
    preview: '🌈 Eye-catching gradients with modern, creative styling',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      text: '#1f2937',
      background: '#ffffff',
      accent: '#f0f9ff'
    },
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Lato, sans-serif'
    },
    layout: {
      headerStyle: 'creative',
      tableStyle: 'modern',
      footerStyle: 'branded'
    }
  },
  {
    id: 'minimalist-green',
    name: 'Minimalist Green',
    description: 'Fresh green theme with minimalist approach',
    preview: '🌿 Fresh and clean with natural green accents',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      text: '#374151',
      background: '#ffffff',
      accent: '#f0fdf4'
    },
    fonts: {
      heading: 'Source Sans Pro, sans-serif',
      body: 'Source Sans Pro, sans-serif'
    },
    layout: {
      headerStyle: 'minimal',
      tableStyle: 'clean',
      footerStyle: 'simple'
    }
  },
  {
    id: 'corporate-navy',
    name: 'Corporate Navy',
    description: 'Professional navy blue template for corporate use',
    preview: '🏢 Traditional corporate style with navy blue branding',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      text: '#1f2937',
      background: '#ffffff',
      accent: '#eff6ff'
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Inter, sans-serif'
    },
    layout: {
      headerStyle: 'bold',
      tableStyle: 'bordered',
      footerStyle: 'detailed'
    }
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

export default InvoicePreview; 