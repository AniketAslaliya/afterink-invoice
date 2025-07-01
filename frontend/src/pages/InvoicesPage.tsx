import React from 'react'
import { Plus, FileText, Search, Filter, Download } from 'lucide-react'

const InvoicesPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-secondary-200/60 to-secondary-300/60 backdrop-blur-lg rounded-2xl p-8 border border-secondary-300/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient-secondary">Invoices</h1>
              <p className="text-secondary-700 mt-2">Create, send, and track your invoices</p>
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
              <button className="btn btn-outline group">
                <Download className="h-4 w-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                Export
              </button>
              <button className="btn btn-primary group">
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="gradient-border">
        <div className="gradient-border-content text-center py-16">
          <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
            <FileText className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-950 mb-4">Invoice Management Coming Soon</h3>
          <p className="text-secondary-700 mb-6 max-w-md mx-auto">
            Professional invoice creation with PDF generation, email integration, and payment tracking.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
            <div className="bg-secondary-300/30 rounded-xl p-4">
              <strong>PDF Generation</strong>
              <p className="text-secondary-600 mt-1">Professional invoice templates</p>
            </div>
            <div className="bg-secondary-300/30 rounded-xl p-4">
              <strong>Email Integration</strong>
              <p className="text-secondary-600 mt-1">Send invoices directly to clients</p>
            </div>
            <div className="bg-secondary-300/30 rounded-xl p-4">
              <strong>Payment Tracking</strong>
              <p className="text-secondary-600 mt-1">Monitor payment status and history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoicesPage 