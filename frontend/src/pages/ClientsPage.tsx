import React, { useEffect, useState } from 'react'
import { Plus, Users, Search, Filter } from 'lucide-react'
import { apiGet } from '../api'

interface Client {
  _id: string;
  companyName: string;
  contactPerson: { firstName: string; lastName: string; email: string };
  status: string;
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiGet('/clients')
      .then(res => setClients(res.data.clients))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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
              <button className="btn btn-primary group" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Add Client
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Modal (UI only) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-900" onClick={() => setShowAddModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Add New Client</h2>
            <p className="text-secondary-700">(Form coming soon)</p>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="gradient-border">
        <div className="gradient-border-content">
          {loading && <div className="text-center py-8">Loading clients...</div>}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}
          {!loading && !error && clients.length === 0 && (
            <div className="text-center py-8 text-secondary-700">No clients found.</div>
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