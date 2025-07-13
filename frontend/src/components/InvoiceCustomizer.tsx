import React, { useState } from 'react';
import { Save, Eye, Palette, Type, Layout, Image } from 'lucide-react';

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

const defaultTemplates: InvoiceTemplate[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, minimalist design with subtle colors',
    preview: '🎨 Clean lines, white space, subtle accent colors',
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
    preview: '🏢 Bold headers, structured layout, corporate colors',
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
    preview: '🎨 Colorful accents, modern fonts, creative layout',
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
  showLogo: true,
  showCompanyDetails: true,
  showPaymentTerms: true,
  paymentTermsText: 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.',
  footerText: 'Thank you for choosing our services!',
  currency: 'INR',
  dateFormat: 'MM/DD/YYYY'
};

interface InvoiceCustomizerProps {
  onSave: (customization: InvoiceCustomization) => void;
  initialCustomization?: InvoiceCustomization;
}

const InvoiceCustomizer: React.FC<InvoiceCustomizerProps> = ({ 
  onSave, 
  initialCustomization 
}) => {
  // Fetch global terms from localStorage (set by settings page)
  let globalTerms = '';
  try {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    globalTerms = settings.termsAndConditions || '';
  } catch {}

  const [customization, setCustomization] = useState<InvoiceCustomization>(
    initialCustomization
      ? {
          ...defaultCustomization,
          ...initialCustomization,
          paymentTermsText: initialCustomization.paymentTermsText || globalTerms || defaultCustomization.paymentTermsText,
        }
      : {
          ...defaultCustomization,
          paymentTermsText: globalTerms || defaultCustomization.paymentTermsText,
        }
  );
  const [activeTab, setActiveTab] = useState('template');
  const [showPreview, setShowPreview] = useState(false);

  const currentTemplate = defaultTemplates.find(t => t.id === customization.template) || defaultTemplates[0];

  const handleTemplateChange = (templateId: string) => {
    const template = defaultTemplates.find(t => t.id === templateId);
    if (template) {
      setCustomization(prev => ({
        ...prev,
        template: templateId,
        colors: template.colors,
        fonts: template.fonts
      }));
    }
  };

  const handleColorChange = (colorKey: keyof InvoiceCustomization['colors'], value: string) => {
    setCustomization(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  const handleSave = () => {
    // Save to localStorage for persistence
    localStorage.setItem('invoiceCustomization', JSON.stringify(customization));
    onSave(customization);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomization(prev => ({
          ...prev,
          companyLogo: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to format color key names
  const formatColorKey = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').trim();
  };

  const tabs = [
    { id: 'template', label: 'Template', icon: Layout },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'branding', label: 'Branding', icon: Image },
  ];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-100">Invoice Customization</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-700">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {activeTab === 'template' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Choose Template</h3>
              <div className="grid grid-cols-1 gap-4">
                {defaultTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      customization.template === template.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => handleTemplateChange(template.id)}
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
                        <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                        <p className="text-xs text-gray-500">{template.preview}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Color Scheme</h3>
              <div className="space-y-4">
                {Object.entries(customization.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-gray-300 capitalize">
                      {formatColorKey(key)}:
                    </label>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded border border-gray-600"
                        style={{ backgroundColor: value }}
                      />
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(key as keyof InvoiceCustomization['colors'], e.target.value)}
                        className="w-16 h-8 rounded border border-gray-600 bg-transparent"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleColorChange(key as keyof InvoiceCustomization['colors'], e.target.value)}
                        className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'typography' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Typography</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Heading Font:</label>
                  <select
                    value={customization.fonts.heading}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      fonts: { ...prev.fonts, heading: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                  >
                    <option value="Inter, sans-serif">Inter (Sans-serif)</option>
                    <option value="Georgia, serif">Georgia (Serif)</option>
                    <option value="Poppins, sans-serif">Poppins (Sans-serif)</option>
                    <option value="Playfair Display, serif">Playfair Display (Serif)</option>
                    <option value="Roboto, sans-serif">Roboto (Sans-serif)</option>
                    <option value="Merriweather, serif">Merriweather (Serif)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Body Font:</label>
                  <select
                    value={customization.fonts.body}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      fonts: { ...prev.fonts, body: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                  >
                    <option value="Inter, sans-serif">Inter (Sans-serif)</option>
                    <option value="Arial, sans-serif">Arial (Sans-serif)</option>
                    <option value="Roboto, sans-serif">Roboto (Sans-serif)</option>
                    <option value="Open Sans, sans-serif">Open Sans (Sans-serif)</option>
                    <option value="Lato, sans-serif">Lato (Sans-serif)</option>
                    <option value="Source Sans Pro, sans-serif">Source Sans Pro (Sans-serif)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Company Branding</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Company Logo:</label>
                  <div className="flex items-center space-x-4">
                    {customization.companyLogo && (
                      <img 
                        src={customization.companyLogo} 
                        alt="Company Logo"
                        className="h-16 w-auto border border-gray-600 rounded"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={customization.showLogo}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          showLogo: e.target.checked
                        }))}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      <span className="text-gray-300">Show logo on invoice</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Company Name:</label>
                  <input
                    type="text"
                    value={customization.companyName}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      companyName: e.target.value
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Address:</label>
                  <textarea
                    value={customization.companyAddress}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      companyAddress: e.target.value
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Phone:</label>
                    <input
                      type="text"
                      value={customization.companyPhone}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        companyPhone: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Email:</label>
                    <input
                      type="email"
                      value={customization.companyEmail}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        companyEmail: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Website:</label>
                  <input
                    type="text"
                    value={customization.companyWebsite || ''}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      companyWebsite: e.target.value
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Payment Terms:</label>
                  <textarea
                    value={customization.paymentTermsText}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      paymentTermsText: e.target.value
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Terms & Conditions (editable for this invoice):</label>
                  <textarea
                    value={customization.termsAndConditions || globalTerms}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      termsAndConditions: e.target.value
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    rows={4}
                    placeholder="Enter terms & conditions for this invoice or leave blank to use global default."
                  />
                  <p className="text-xs text-gray-400 mt-1">If left blank, the global default from settings will be used.</p>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Footer Text:</label>
                  <input
                    type="text"
                    value={customization.footerText}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      footerText: e.target.value
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Currency:</label>
                    <select
                      value={customization.currency}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        currency: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
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
                    <label className="block text-gray-300 mb-2">Date Format:</label>
                    <select
                      value={customization.dateFormat}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        dateFormat: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="border-t border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Live Preview</h3>
          <div className="bg-white rounded-lg p-4 max-h-96 overflow-auto">
            <div className="text-center text-gray-500 py-8">
              <p>Invoice preview will appear here</p>
              <p className="text-sm">Template: {currentTemplate.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceCustomizer; 