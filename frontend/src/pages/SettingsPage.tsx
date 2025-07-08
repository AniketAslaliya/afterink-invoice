import React, { useState, useEffect } from 'react'
import { Save, Building, Bell, Shield, Palette, Globe, Clock, Key, Smartphone, Mail, Database, Lock, Brush, FileText } from 'lucide-react'
import { apiGet, apiPost } from '../api'
import ThemeSettings from '../components/ThemeSettings'

interface AppSettings {
  business: {
    companyName: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    taxId: string
    website: string
    logo?: string
    primaryColor: string
    secondaryColor: string
  }
  notifications: {
    emailInvoices: boolean
    emailPayments: boolean
    emailOverdue: boolean
    emailReports: boolean
    browserNotifications: boolean
    weeklyReports: boolean
    monthlyReports: boolean
    smsNotifications: boolean
  }
  preferences: {
    defaultCurrency: string
    dateFormat: string
    timeFormat: string
    timezone: string
    language: string
    theme: string
    invoiceTemplate: string
    autoBackup: boolean
    twoFactorAuth: boolean
  }
  security: {
    passwordExpiry: number
    sessionTimeout: number
    ipWhitelist: string[]
    allowMultipleSessions: boolean
    requireStrongPassword: boolean
  }
  paymentTerms?: string
  termsAndConditions?: string
  bankDetails: {
    accountName: string
    accountNumber: string
    ifsc: string
    accountType: string
    bankName: string
    upiId: string
  }
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    business: {
      companyName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      taxId: '',
      website: '',
      logo: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1F2937'
    },
    notifications: {
      emailInvoices: true,
      emailPayments: true,
      emailOverdue: true,
      emailReports: false,
      browserNotifications: false,
      weeklyReports: true,
      monthlyReports: false,
      smsNotifications: false
    },
    preferences: {
      defaultCurrency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      timezone: 'Asia/Kolkata',
      language: 'en',
      theme: 'dark',
      invoiceTemplate: 'modern',
      autoBackup: true,
      twoFactorAuth: false
    },
    security: {
      passwordExpiry: 90,
      sessionTimeout: 30,
      ipWhitelist: [],
      allowMultipleSessions: true,
      requireStrongPassword: true
    },
    paymentTerms: 'Payment is due within 30 days of invoice date.',
    termsAndConditions: '',
    bankDetails: {
      accountName: 'ASLALIYA ANIKET PARESHBHAI',
      accountNumber: '41497670019',
      ifsc: 'SBIN0018700',
      accountType: 'Savings',
      bankName: 'The State Bank Of India',
      upiId: 'aniketaslaliya@oksbi'
    }
  })
  
  const [activeTab, setActiveTab] = useState('business')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await apiGet('/settings')
      if (res && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }))
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      // Save to localStorage for immediate brand color integration with invoices
      const businessSettings = {
        companyName: settings.business.companyName,
        address: settings.business.address,
        city: settings.business.city,
        state: settings.business.state,
        zipCode: settings.business.zipCode,
        country: settings.business.country,
        taxId: settings.business.taxId,
        website: settings.business.website,
        primaryColor: settings.business.primaryColor,
        secondaryColor: settings.business.secondaryColor,
        updatedAt: new Date().toISOString()
      }
      
      localStorage.setItem('businessSettings', JSON.stringify(businessSettings))
      
      // Also save invoice customization with new colors
      const existingCustomization = localStorage.getItem('invoiceCustomization')
      if (existingCustomization) {
        const customization = JSON.parse(existingCustomization)
        customization.colors.primary = settings.business.primaryColor
        customization.colors.secondary = settings.business.secondaryColor
        customization.companyName = settings.business.companyName
        customization.companyAddress = `${settings.business.address}, ${settings.business.city}, ${settings.business.state} ${settings.business.zipCode}, ${settings.business.country}`
        localStorage.setItem('invoiceCustomization', JSON.stringify(customization))
      }
      
      await apiPost('/settings', settings)
      setSuccess('✅ Settings saved successfully! Brand colors will be applied to new invoices.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setError('❌ Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (section: keyof AppSettings | 'termsAndConditions' | 'paymentTerms', field: string, value: any) => {
    if (section === 'termsAndConditions') {
      setSettings(prev => ({ ...prev, termsAndConditions: value }))
    } else if (section === 'paymentTerms') {
      setSettings(prev => ({ ...prev, paymentTerms: value }))
    } else {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }))
    }
    if (success) setSuccess(null)
  }

  const tabs = [
    { id: 'business', label: 'Business', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'theme', label: 'Theme & UI', icon: Brush },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'bankDetails', label: 'Bank Details', icon: Database }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Application Settings</h1>
              <p className="text-gray-400">Manage your business and application preferences</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-6 py-4 text-left text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white border-r-4 border-blue-400'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-8">
                  {/* Business Settings */}
                  {activeTab === 'business' && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        Business Information
                      </h3>

                      {/* Company Details */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Company Name *
                            </label>
                            <input
                              type="text"
                              value={settings.business.companyName}
                              onChange={(e) => updateSettings('business', 'companyName', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter company name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Website
                            </label>
                            <input
                              type="url"
                              value={settings.business.website}
                              onChange={(e) => updateSettings('business', 'website', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Business Address
                          </label>
                          <input
                            type="text"
                            value={settings.business.address}
                            onChange={(e) => updateSettings('business', 'address', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Street address"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              value={settings.business.city}
                              onChange={(e) => updateSettings('business', 'city', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="City"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              State
                            </label>
                            <input
                              type="text"
                              value={settings.business.state}
                              onChange={(e) => updateSettings('business', 'state', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="State"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              ZIP Code
                            </label>
                            <input
                              type="text"
                              value={settings.business.zipCode}
                              onChange={(e) => updateSettings('business', 'zipCode', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="ZIP"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Country
                            </label>
                            <select
                              value={settings.business.country}
                              onChange={(e) => updateSettings('business', 'country', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Country</option>
                              <option value="IN">India</option>
                              <option value="US">United States</option>
                              <option value="GB">United Kingdom</option>
                              <option value="CA">Canada</option>
                              <option value="AU">Australia</option>
                              <option value="DE">Germany</option>
                              <option value="FR">France</option>
                              <option value="SG">Singapore</option>
                              <option value="AE">UAE</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Tax ID / GST Number
                            </label>
                            <input
                              type="text"
                              value={settings.business.taxId}
                              onChange={(e) => updateSettings('business', 'taxId', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Tax identification number"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Branding */}
                      <div className="border-t border-gray-700 pt-8">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                          <Palette className="h-5 w-5 mr-2" />
                          Branding & Colors
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Primary Color
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={settings.business.primaryColor}
                                onChange={(e) => updateSettings('business', 'primaryColor', e.target.value)}
                                className="w-12 h-12 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.business.primaryColor}
                                onChange={(e) => updateSettings('business', 'primaryColor', e.target.value)}
                                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Secondary Color
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={settings.business.secondaryColor}
                                onChange={(e) => updateSettings('business', 'secondaryColor', e.target.value)}
                                className="w-12 h-12 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.business.secondaryColor}
                                onChange={(e) => updateSettings('business', 'secondaryColor', e.target.value)}
                                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Global Invoice Terms */}
                      <div className="border-t border-gray-700 pt-8">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          Global Invoice Terms
                        </h4>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Payment Terms
                            </label>
                            <textarea
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                              value={settings.paymentTerms || ''}
                              onChange={e => updateSettings('paymentTerms', '', e.target.value)}
                              placeholder="e.g., Payment is due within 30 days of invoice date. Late payments may incur additional charges."
                            />
                            <p className="text-xs text-gray-400 mt-1">Default payment terms that will be applied to all new invoices.</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Terms and Conditions
                            </label>
                            <textarea
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                              value={settings.termsAndConditions || ''}
                              onChange={e => updateSettings('termsAndConditions', '', e.target.value)}
                              placeholder="Enter your standard terms and conditions here..."
                            />
                            <p className="text-xs text-gray-400 mt-1">Standard terms and conditions that will appear on all invoices.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Settings */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Bell className="h-5 w-5 mr-2" />
                        Notification Preferences
                      </h3>

                      {/* Email Notifications */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Mail className="h-5 w-5 mr-2" />
                          Email Notifications
                        </h4>
                        <div className="space-y-4">
                          {[
                            { key: 'emailInvoices', label: 'New invoice created', desc: 'Get notified when invoices are generated' },
                            { key: 'emailPayments', label: 'Payment received', desc: 'Get notified when payments are processed' },
                            { key: 'emailOverdue', label: 'Overdue invoices', desc: 'Get notified about overdue payments' },
                            { key: 'emailReports', label: 'Report generation', desc: 'Get notified when reports are ready' },
                            { key: 'weeklyReports', label: 'Weekly summary', desc: 'Receive weekly business summary' },
                            { key: 'monthlyReports', label: 'Monthly reports', desc: 'Receive detailed monthly reports' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                              <div>
                                <p className="text-white font-medium">{item.label}</p>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                                  onChange={(e) => updateSettings('notifications', item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Other Notifications */}
                      <div className="border-t border-gray-700 pt-8">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Smartphone className="h-5 w-5 mr-2" />
                          Other Notifications
                        </h4>
                        <div className="space-y-4">
                          {[
                            { key: 'browserNotifications', label: 'Browser notifications', desc: 'Show notifications in your browser' },
                            { key: 'smsNotifications', label: 'SMS notifications', desc: 'Receive important updates via SMS' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                              <div>
                                <p className="text-white font-medium">{item.label}</p>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                                  onChange={(e) => updateSettings('notifications', item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preferences Settings */}
                  {activeTab === 'preferences' && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Palette className="h-5 w-5 mr-2" />
                        Application Preferences
                      </h3>

                      {/* Localization */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Globe className="h-5 w-5 mr-2" />
                          Localization
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Default Currency
                            </label>
                            <select
                              value={settings.preferences.defaultCurrency}
                              onChange={(e) => updateSettings('preferences', 'defaultCurrency', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="INR">Indian Rupee (₹)</option>
                              <option value="USD">US Dollar ($)</option>
                              <option value="EUR">Euro (€)</option>
                              <option value="GBP">British Pound (£)</option>
                              <option value="AUD">Australian Dollar (A$)</option>
                              <option value="CAD">Canadian Dollar (C$)</option>
                              <option value="SGD">Singapore Dollar (S$)</option>
                              <option value="AED">UAE Dirham (د.إ)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Language
                            </label>
                            <select
                              value={settings.preferences.language}
                              onChange={(e) => updateSettings('preferences', 'language', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                              <option value="de">German</option>
                              <option value="hi">Hindi</option>
                              <option value="ar">Arabic</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="border-t border-gray-700 pt-8">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Clock className="h-5 w-5 mr-2" />
                          Date & Time
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Date Format
                            </label>
                            <select
                              value={settings.preferences.dateFormat}
                              onChange={(e) => updateSettings('preferences', 'dateFormat', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Time Format
                            </label>
                            <select
                              value={settings.preferences.timeFormat}
                              onChange={(e) => updateSettings('preferences', 'timeFormat', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="12h">12 Hour (AM/PM)</option>
                              <option value="24h">24 Hour</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Timezone
                            </label>
                            <select
                              value={settings.preferences.timezone}
                              onChange={(e) => updateSettings('preferences', 'timezone', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                              <option value="America/New_York">America/New_York (EST)</option>
                              <option value="Europe/London">Europe/London (GMT)</option>
                              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* System Preferences */}
                      <div className="border-t border-gray-700 pt-8">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Database className="h-5 w-5 mr-2" />
                          System Preferences
                        </h4>
                        <div className="space-y-4">
                          {[
                            { key: 'autoBackup', label: 'Automatic backups', desc: 'Enable daily automatic data backups' },
                            { key: 'twoFactorAuth', label: 'Two-factor authentication', desc: 'Add extra security to your account' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                              <div>
                                <p className="text-white font-medium">{item.label}</p>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.preferences[item.key as keyof typeof settings.preferences] as boolean}
                                  onChange={(e) => updateSettings('preferences', item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Theme & UI Settings */}
                  {activeTab === 'theme' && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Brush className="h-5 w-5 mr-2" />
                        Theme & Personalization
                      </h3>
                      <ThemeSettings />
                    </div>
                  )}

                  {/* Security Settings */}
                  {activeTab === 'security' && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Security & Access Control
                      </h3>

                      {/* Password Policy */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Key className="h-5 w-5 mr-2" />
                          Password Policy
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Password Expiry (Days)
                            </label>
                            <input
                              type="number"
                              value={settings.security.passwordExpiry}
                              onChange={(e) => updateSettings('security', 'passwordExpiry', parseInt(e.target.value))}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="30"
                              max="365"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Session Timeout (Minutes)
                            </label>
                            <input
                              type="number"
                              value={settings.security.sessionTimeout}
                              onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="5"
                              max="1440"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Access Control */}
                      <div className="border-t border-gray-700 pt-8">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Lock className="h-5 w-5 mr-2" />
                          Access Control
                        </h4>
                        <div className="space-y-4">
                          {[
                            { key: 'allowMultipleSessions', label: 'Allow multiple sessions', desc: 'Allow login from multiple devices simultaneously' },
                            { key: 'requireStrongPassword', label: 'Require strong passwords', desc: 'Enforce complex password requirements' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                              <div>
                                <p className="text-white font-medium">{item.label}</p>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.security[item.key as keyof typeof settings.security] as boolean}
                                  onChange={(e) => updateSettings('security', item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Details */}
                  {activeTab === 'bankDetails' && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Database className="h-5 w-5 mr-2" />
                        Bank Details
                      </h3>

                      {/* Bank Details Form */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Account Name
                            </label>
                            <input
                              type="text"
                              value={settings.bankDetails.accountName}
                              onChange={(e) => updateSettings('bankDetails', 'accountName', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter account name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Account Number
                            </label>
                            <input
                              type="text"
                              value={settings.bankDetails.accountNumber}
                              onChange={(e) => updateSettings('bankDetails', 'accountNumber', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter account number"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              IFSC
                            </label>
                            <input
                              type="text"
                              value={settings.bankDetails.ifsc}
                              onChange={(e) => updateSettings('bankDetails', 'ifsc', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter IFSC"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Account Type
                            </label>
                            <input
                              type="text"
                              value={settings.bankDetails.accountType}
                              onChange={(e) => updateSettings('bankDetails', 'accountType', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter account type"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              value={settings.bankDetails.bankName}
                              onChange={(e) => updateSettings('bankDetails', 'bankName', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter bank name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              UPI ID
                            </label>
                            <input
                              type="text"
                              value={settings.bankDetails.upiId}
                              onChange={(e) => updateSettings('bankDetails', 'upiId', e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter UPI ID"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SettingsPage 