import React from 'react'
import { Plus, Users, Search, Filter } from 'lucide-react'

const ClientsPage: React.FC = () => {
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
              <button className="btn btn-primary group">
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Add Client
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="gradient-border">
        <div className="gradient-border-content text-center py-16">
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
            <Users className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-950 mb-4">Client Management Coming Soon</h3>
          <p className="text-secondary-700 mb-6 max-w-md mx-auto">
            A comprehensive client management system with contact details, project history, and communication tracking.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
            <div className="bg-secondary-300/30 rounded-xl p-4">
              <strong>Contact Management</strong>
              <p className="text-secondary-600 mt-1">Store and organize client information</p>
            </div>
            <div className="bg-secondary-300/30 rounded-xl p-4">
              <strong>Project History</strong>
              <p className="text-secondary-600 mt-1">Track all projects per client</p>
            </div>
            <div className="bg-secondary-300/30 rounded-xl p-4">
              <strong>Communication Log</strong>
              <p className="text-secondary-600 mt-1">Record all client interactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientsPage 