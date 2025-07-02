import React, { useState, useEffect } from 'react'
import { Save, User, Building, Bell, Shield, Eye, EyeOff } from 'lucide-react'
import { apiGet, apiPost } from '../api'

interface UserSettings {
  profile: {
    firstName: string
    lastName: string
    email: string
    phone: string
    timezone: string
  }
  business: {
    companyName: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    taxId: string
    website: string
  }
  notifications: {
    emailInvoices: boolean
    emailPayments: boolean
    emailOverdue: boolean
    browserNotifications: boolean
    weeklyReports: boolean
  }
  preferences: {
    defaultCurrency: string
    dateFormat: string
    theme: string
    language: string
  }
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      timezone: 'UTC'
    },
    business: {
      companyName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      taxId: '',
      website: ''
    },
    notifications: {
      emailInvoices: true,
      emailPayments: true,
      emailOverdue: true,
      browserNotifications: false,
      weeklyReports: true
    },
    preferences: {
      defaultCurrency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      theme: 'light',
      language: 'en'
    }
  })
  
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // Fetch user profile data
      const user = await apiGet('/users/profile')
      
      setSettings(prev => ({
        ...prev,
        profile: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          timezone: user.timezone || 'UTC'
        }
      }))
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await apiPost('/users/settings', settings)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (section: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-950">Settings</h1>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-body p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-none first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                          : 'text-secondary-600 hover:bg-secondary-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-body">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={settings.profile.firstName}
                        onChange={(e) => updateSettings('profile', 'firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={settings.profile.lastName}
                        onChange={(e) => updateSettings('profile', 'lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => updateSettings('profile', 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={settings.profile.phone}
                        onChange={(e) => updateSettings('profile', 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-4">Preferences</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Default Currency
                        </label>
                        <select
                          value={settings.preferences.defaultCurrency}
                          onChange={(e) => updateSettings('preferences', 'defaultCurrency', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Date Format
                        </label>
                        <select
                          value={settings.preferences.dateFormat}
                          onChange={(e) => updateSettings('preferences', 'dateFormat', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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

              {/* Business Settings */}
              {activeTab === 'business' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={settings.business.companyName}
                        onChange={(e) => updateSettings('business', 'companyName', e.target.value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={settings.business.address}
                        onChange={(e) => updateSettings('business', 'address', e.target.value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={settings.business.city}
                          onChange={(e) => updateSettings('business', 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={settings.business.state}
                          onChange={(e) => updateSettings('business', 'state', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={settings.business.zipCode}
                          onChange={(e) => updateSettings('business', 'zipCode', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-secondary-900">Email Notifications for Invoices</h4>
                        <p className="text-sm text-secondary-600">Receive emails when invoices are created or updated</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailInvoices}
                          onChange={(e) => updateSettings('notifications', 'emailInvoices', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-secondary-900">Payment Notifications</h4>
                        <p className="text-sm text-secondary-600">Receive emails when payments are received</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailPayments}
                          onChange={(e) => updateSettings('notifications', 'emailPayments', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-secondary-900">Weekly Reports</h4>
                        <p className="text-sm text-secondary-600">Receive weekly business summary reports</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.weeklyReports}
                          onChange={(e) => updateSettings('notifications', 'weeklyReports', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium mb-4">Change Password</h4>
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-secondary-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-secondary-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <button className="btn btn-secondary">
                          Change Password
                        </button>
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
  )
}

export default SettingsPage 