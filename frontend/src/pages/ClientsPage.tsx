import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { apiGet, apiPost } from '../api'

interface Client {
  _id: string;
  companyName: string;
  contactPerson: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone?: string;
    countryCode?: string;
    position?: string;
  };
  status: string;
}

interface NewClient {
  companyName: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    countryCode: string;
    position: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentTerms: number;
  taxNumber: string;
  notes: string;
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newClient, setNewClient] = useState<NewClient>({
    companyName: '',
            contactPerson: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          countryCode: '+91',
          position: ''
        },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    paymentTerms: 30,
    taxNumber: '',
    notes: ''
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const res = await apiGet('/clients')
      setClients(res.data.clients || [])
      setError(null)
    } catch (err: any) {
      console.error('Fetch clients error:', err)
      // Check if it's an authentication error
      if (err.message.includes('Access token') || err.message.includes('Failed to fetch') || err.message.includes('401')) {
        setError('authentication')
      } else {
        setError(err.message)
      }
      setClients([]) // Set empty array so we can show "no clients" message
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async () => {
    try {
      setSubmitting(true)
      
      // Create the client data with proper values (no "N/A" placeholders)
      const clientData = {
        companyName: newClient.companyName,
        contactPerson: {
          firstName: newClient.contactPerson.firstName || 'Contact',
          lastName: newClient.contactPerson.lastName || 'Person', 
          email: newClient.contactPerson.email,
          phone: `${newClient.contactPerson.countryCode}${newClient.contactPerson.phone}`,
          position: newClient.contactPerson.position || ''
        },
        address: {
          street: newClient.address.street || '123 Main St',
          city: newClient.address.city || 'City',
          state: newClient.address.state || 'State',
          zipCode: newClient.address.zipCode || '12345',
          country: newClient.address.country || 'United States'
        },
        paymentTerms: newClient.paymentTerms || 30,
        taxNumber: newClient.taxNumber || '',
        notes: newClient.notes || ''
      }
      
      console.log('Sending client data:', clientData)
      const res = await apiPost('/clients', clientData)
      console.log('API Response:', res)
      
      // Check if the response indicates a validation error
      if (res && res.success === false) {
        console.error('Backend validation failed:', res.error);
        throw new Error(`Backend validation failed: ${res.error.message || 'Unknown validation error'}`);
      }
      
      // Add the new client to the list (apiPost now handles the response format conversion)
      setClients([res, ...clients])
      setShowAddModal(false)
      
      // Reset form
      setNewClient({
        companyName: '',
        contactPerson: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          countryCode: '+91',
          position: ''
        },
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        paymentTerms: 30,
        taxNumber: '',
        notes: ''
      })
      
      console.log('Client created successfully!')
      alert('Client created successfully!')
    } catch (err: any) {
      console.error('Error creating client:', err)
      alert('Error creating client: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-secondary-200/60 to-secondary-300/60 backdrop-blur-lg rounded-2xl p-8 border border-secondary-300/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient-secondary">Clients</h1>
              <p className="text-secondary-700 mt-2">Manage your client relationships and contacts</p>
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
                data-testid="add-client-btn"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Add Client
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl shadow-lg relative mx-4 my-8 border border-gray-700">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none" 
              onClick={() => setShowAddModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Add New Client</h2>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">Company Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={newClient.companyName}
                    onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">Contact Person</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={newClient.contactPerson.firstName}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        contactPerson: { ...newClient.contactPerson, firstName: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newClient.contactPerson.lastName}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        contactPerson: { ...newClient.contactPerson, lastName: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newClient.contactPerson.email}
                    onChange={(e) => setNewClient({ 
                      ...newClient, 
                      contactPerson: { ...newClient.contactPerson, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Phone *
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={newClient.contactPerson.countryCode}
                        onChange={(e) => setNewClient({ 
                          ...newClient, 
                          contactPerson: { ...newClient.contactPerson, countryCode: e.target.value }
                        })}
                        className="w-24 px-2 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+65">🇸🇬 +65</option>
                      </select>
                      <input
                        type="tel"
                        value={newClient.contactPerson.phone}
                        onChange={(e) => setNewClient({ 
                          ...newClient, 
                          contactPerson: { ...newClient.contactPerson, phone: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        placeholder="Phone number (without country code)"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={newClient.contactPerson.position}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        contactPerson: { ...newClient.contactPerson, position: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Job title"
                    />
                  </div>
                </div>
              </div>

              {/* Address - Optional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">Address (Optional)</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={newClient.address.street}
                    onChange={(e) => setNewClient({ 
                      ...newClient, 
                      address: { ...newClient.address, street: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={newClient.address.city}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        address: { ...newClient.address, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={newClient.address.state}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        address: { ...newClient.address, state: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={newClient.address.zipCode}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        address: { ...newClient.address, zipCode: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Zip code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={newClient.address.country}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        address: { ...newClient.address, country: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Payment Terms (days)
                    </label>
                    <input
                      type="number"
                      value={newClient.paymentTerms}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        paymentTerms: parseInt(e.target.value) || 30
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      min="1"
                      max="365"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tax Number
                    </label>
                    <input
                      type="text"
                      value={newClient.taxNumber}
                      onChange={(e) => setNewClient({ ...newClient, taxNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Tax ID"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newClient.notes}
                    onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Additional notes"
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
                onClick={handleAddClient}
                disabled={submitting || !newClient.companyName || !newClient.contactPerson.email || !newClient.contactPerson.phone}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="gradient-border">
        <div className="gradient-border-content">
          {loading && <div className="text-center py-8">Loading clients...</div>}
          {error === 'authentication' && (
            <div className="text-center py-8">
              <div className="text-yellow-500 mb-2">🔒 Please log in to view clients</div>
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
          {!loading && (!error || error === 'authentication') && clients.length === 0 && (
            <div className="text-center py-8 text-secondary-700">
              <div className="text-lg mb-2">📋 No clients found</div>
              <div className="text-sm">Get started by adding your first client!</div>
            </div>
          )}
          {!loading && !error && clients.length > 0 && (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-4">Company</th>
                  <th className="text-left py-2 px-4">Contact</th>
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-left py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client._id} className="border-t">
                    <td className="py-2 px-4 font-semibold">{client.companyName}</td>
                    <td className="py-2 px-4">{client.contactPerson.firstName} {client.contactPerson.lastName}</td>
                    <td className="py-2 px-4">{client.contactPerson.email}</td>
                    <td className="py-2 px-4">{client.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClientsPage 