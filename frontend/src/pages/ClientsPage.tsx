import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { apiGet, apiPost, apiPut } from '../api'
import { useAppSelector, useAppDispatch } from '../store'
import { fetchClients } from '../store/clientsSlice'

interface Client {
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
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  status: 'active' | 'inactive' | 'prospect';
  createdAt?: string;
  paymentTerms?: number;
  taxNumber?: string;
  notes?: string;
}

const ClientsPage: React.FC = () => {
  const clients = useAppSelector((state: any) => state.clients.clients)
  const loading = useAppSelector((state: any) => state.clients.loading)
  const error = useAppSelector((state: any) => state.clients.error)
  const dispatch = useAppDispatch()
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newClient, setNewClient] = useState({
    companyName: '',
    contactPerson: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      countryCode: '+91'
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    status: 'active' as 'active' | 'inactive' | 'prospect',
    paymentTerms: 30,
    taxNumber: '',
    notes: ''
  })
  const [addClientError, setAddClientError] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchClients())
  }, [dispatch])

  // Filter and sort clients based on search criteria
  const filteredClients = clients
    .filter((client: Client) => {
      const matchesSearch = searchTerm === '' || 
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactPerson.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactPerson.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactPerson.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === '' || client.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a: Client, b: Client) => {
      switch (sortBy) {
        case 'company-az':
          return a.companyName.localeCompare(b.companyName)
        case 'company-za':
          return b.companyName.localeCompare(a.companyName)
        case 'oldest':
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
        case 'newest':
        default:
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      }
    })

  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
    setShowDetailsModal(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setNewClient({
      companyName: client.companyName,
              contactPerson: {
          firstName: client.contactPerson.firstName,
          lastName: client.contactPerson.lastName,
          email: client.contactPerson.email,
          phone: client.contactPerson.phone || '',
          position: client.contactPerson.position || '',
          countryCode: client.contactPerson.countryCode || '+91'
        },
      address: client.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      status: client.status,
      paymentTerms: client.paymentTerms || 30,
      taxNumber: client.taxNumber || '',
      notes: client.notes || ''
    })
    setShowEditModal(true)
  }

  const handleCreateInvoice = (client: Client) => {
    // Navigate to invoice creation with pre-filled client data
    window.location.href = `/invoices?client=${client._id}&action=create`
  }

  const handleAddClient = async () => {
    // Frontend validation for required fields
    if (!newClient.contactPerson.firstName.trim() || !newClient.contactPerson.lastName.trim()) {
      setAddClientError('First Name and Last Name are required for the contact person.');
      return;
    } else {
      setAddClientError(null);
    }
    try {
      const clientData = {
        companyName: newClient.companyName,
        contactPerson: {
          firstName: newClient.contactPerson.firstName,
          lastName: newClient.contactPerson.lastName,
          email: newClient.contactPerson.email,
          phone: newClient.contactPerson.phone,
          position: newClient.contactPerson.position,
          countryCode: newClient.contactPerson.countryCode
        },
        address: newClient.address,
        status: newClient.status
      }
      const res = await apiPost('/clients', clientData)
      let clientObject
      if (res && res.data && res.data.client) {
        clientObject = res.data.client
      } else if (res && res.client) {
        clientObject = res.client
      } else if (res && res._id) {
        clientObject = res
      } else {
        throw new Error('Unexpected API response structure')
      }
      dispatch(fetchClients())
      setShowAddModal(false)
      setNewClient({
        companyName: '',
        contactPerson: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          position: '',
          countryCode: '+91'
        },
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        status: 'active',
        paymentTerms: 30,
        taxNumber: '',
        notes: ''
      })
    } catch (error: any) {
      console.error('Error creating client:', error)
      dispatch(fetchClients())
    }
  }

  const handleUpdateClient = async () => {
    if (!selectedClient) return
    
    try {
      const clientData = {
        companyName: newClient.companyName,
        contactPerson: newClient.contactPerson,
        address: newClient.address,
        status: newClient.status
      }
      
      const res = await apiPut(`/clients/${selectedClient._id}`, clientData)
      
      // Update the client in the list
      dispatch(fetchClients())
      
      setShowEditModal(false)
      setSelectedClient(null)
    } catch (error: any) {
      console.error('Error updating client:', error)
      dispatch(fetchClients())
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
                      className={`w-full px-3 py-2 bg-gray-800 border ${!newClient.contactPerson.firstName.trim() && addClientError ? 'border-red-500' : 'border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white`}
                      placeholder="First name"
                      required
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
                      className={`w-full px-3 py-2 bg-gray-800 border ${!newClient.contactPerson.lastName.trim() && addClientError ? 'border-red-500' : 'border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white`}
                      placeholder="Last name"
                      required
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
                {addClientError && (
                  <div className="text-red-500 text-sm mt-2">{addClientError}</div>
                )}
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
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={loading || !newClient.companyName || !newClient.contactPerson.email || !newClient.contactPerson.phone}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? 'Adding...' : 'Add Client'}
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
              placeholder="Search clients by company name, contact person, or email..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>
          
          {/* Sort Options */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="company-az">Company A-Z</option>
            <option value="company-za">Company Z-A</option>
          </select>
        </div>
      </div>

      {/* Client Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Total Clients</p>
              <p className="text-2xl font-bold text-white">{clients.length}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Active</p>
              <p className="text-2xl font-bold text-white">{clients.filter((c: Client) => c.status === 'active').length}</p>
            </div>
            <div className="bg-green-600 p-3 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">Prospects</p>
              <p className="text-2xl font-bold text-white">{clients.filter((c: Client) => c.status === 'prospect').length}</p>
            </div>
            <div className="bg-yellow-600 p-3 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">New This Month</p>
              <p className="text-2xl font-bold text-white">
                {clients.filter((c: Client) => {
                  // For demo, just show some number since we don't have creation dates
                  return true;
                }).length}
              </p>
            </div>
            <div className="bg-purple-600 p-3 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">All Clients</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{clients.length} total clients</span>
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
              <span className="ml-3 text-gray-300">Loading clients...</span>
            </div>
          )}
          
          {error === 'authentication' && (
            <div className="text-center py-12">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-yellow-400 text-4xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold text-white mb-2">Authentication Required</h3>
                <p className="text-gray-300 text-sm mb-4">Please log in to view your clients</p>
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
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Clients</h3>
                <p className="text-gray-300 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {!loading && (!error || error === 'authentication') && clients.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-8 max-w-md mx-auto">
                <div className="text-gray-500 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-white mb-2">No Clients Yet</h3>
                <p className="text-gray-300 text-sm mb-6">Start building your client base by adding your first client!</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-all"
                >
                  <Plus size={20} />
                  Add First Client
                </button>
              </div>
            </div>
          )}
          
          {!loading && !error && clients.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredClients.map((client: Client) => {
                const statusColors: Record<string, string> = {
                  'active': 'bg-green-900 text-green-400 border-green-700',
                  'inactive': 'bg-gray-700 text-gray-300 border-gray-600',
                  'prospect': 'bg-yellow-900 text-yellow-400 border-yellow-700'
                };
                
                return (
                  <div key={client._id} className="border border-gray-600 rounded-xl p-6 hover:shadow-lg hover:bg-gray-700 transition-all duration-200 group">
                    <div className="flex items-start justify-between mb-4">
                      {/* Company Info */}
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-900 p-3 rounded-xl">
                          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{client.companyName}</h3>
                          <p className="text-gray-400 text-sm">
                            {client.contactPerson.firstName} {client.contactPerson.lastName}
                            {client.contactPerson.position && (
                              <span className="text-gray-500"> • {client.contactPerson.position}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[client.status] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                        {client.status?.charAt(0).toUpperCase() + client.status?.slice(1) || 'Unknown'}
                      </span>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-300">{client.contactPerson.email}</span>
                      </div>
                      {client.contactPerson.phone && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-300">{client.contactPerson.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-600">
                      <button
                        className="flex-1 bg-blue-900 hover:bg-blue-800 text-blue-400 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => handleViewClient(client)}
                      >
                        View Details
                      </button>
                      <button
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => handleEditClient(client)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-green-900 hover:bg-green-800 text-green-400 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => handleCreateInvoice(client)}
                      >
                        Invoice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Client Details Modal */}
      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl shadow-lg relative mx-4 my-8 border border-gray-700">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none" 
              onClick={() => setShowDetailsModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Client Details</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
                  <p className="text-white bg-gray-800 px-3 py-2 rounded-md">{selectedClient.companyName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    selectedClient.status === 'active' ? 'bg-green-900 text-green-400 border-green-700' :
                    selectedClient.status === 'inactive' ? 'bg-gray-700 text-gray-300 border-gray-600' :
                    'bg-yellow-900 text-yellow-400 border-yellow-700'
                  }`}>
                    {selectedClient.status?.charAt(0).toUpperCase() + selectedClient.status?.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contact Person</label>
                  <p className="text-white bg-gray-800 px-3 py-2 rounded-md">
                    {selectedClient.contactPerson.firstName} {selectedClient.contactPerson.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                  <p className="text-white bg-gray-800 px-3 py-2 rounded-md">
                    {selectedClient.contactPerson.position || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <p className="text-white bg-gray-800 px-3 py-2 rounded-md">{selectedClient.contactPerson.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <p className="text-white bg-gray-800 px-3 py-2 rounded-md">
                    {selectedClient.contactPerson.phone || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedClient.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                  <p className="text-white bg-gray-800 px-3 py-2 rounded-md">
                    {selectedClient.address.street && `${selectedClient.address.street}, `}
                    {selectedClient.address.city && `${selectedClient.address.city}, `}
                    {selectedClient.address.state && `${selectedClient.address.state} `}
                    {selectedClient.address.zipCode && selectedClient.address.zipCode}
                    {selectedClient.address.country && `, ${selectedClient.address.country}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  handleEditClient(selectedClient)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Client
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  handleCreateInvoice(selectedClient)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl shadow-lg relative mx-4 my-8 border border-gray-700">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none" 
              onClick={() => setShowEditModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Edit Client</h2>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={newClient.companyName}
                    onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={newClient.status}
                    onChange={(e) => setNewClient({ ...newClient, status: e.target.value as 'active' | 'inactive' | 'prospect' })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={newClient.contactPerson.firstName}
                    onChange={(e) => setNewClient({ 
                      ...newClient, 
                      contactPerson: { ...newClient.contactPerson, firstName: e.target.value }
                    })}
                    className={`w-full px-3 py-2 bg-gray-800 border ${!newClient.contactPerson.firstName.trim() && addClientError ? 'border-red-500' : 'border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white`}
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={newClient.contactPerson.lastName}
                    onChange={(e) => setNewClient({ 
                      ...newClient, 
                      contactPerson: { ...newClient.contactPerson, lastName: e.target.value }
                    })}
                    className={`w-full px-3 py-2 bg-gray-800 border ${!newClient.contactPerson.lastName.trim() && addClientError ? 'border-red-500' : 'border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white`}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newClient.contactPerson.email}
                    onChange={(e) => setNewClient({ 
                      ...newClient, 
                      contactPerson: { ...newClient.contactPerson, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newClient.contactPerson.phone}
                    onChange={(e) => setNewClient({ 
                      ...newClient, 
                      contactPerson: { ...newClient.contactPerson, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                <input
                  type="text"
                  value={newClient.contactPerson.position}
                  onChange={(e) => setNewClient({ 
                    ...newClient, 
                    contactPerson: { ...newClient.contactPerson, position: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateClient}
                disabled={loading || !newClient.companyName || !newClient.contactPerson.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientsPage 