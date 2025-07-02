import React, { useEffect, useState } from 'react';
import { Plus, FileText, Search, Filter } from 'lucide-react';
import { apiGet } from '../api';

// Type for Invoice
interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  status: string;
  totalAmount: number;
  dueDate: string;
}

/**
 * InvoicesPage - Displays a list of invoices fetched from the backend.
 * Allows searching, filtering, and adding new invoices (UI only for now).
 */
const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch invoices from backend on mount
  useEffect(() => {
    setLoading(true);
    apiGet('/invoices')
      .then(res => setInvoices(res.data.invoices))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-secondary-200/60 to-secondary-300/60 backdrop-blur-lg rounded-2xl p-8 border border-secondary-300/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient-secondary">Invoices</h1>
              <p className="text-secondary-700 mt-2">Manage and track your invoices</p>
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
                Add Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Invoice Modal (UI only) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-900" onClick={() => setShowAddModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Add New Invoice</h2>
            <p className="text-secondary-700">(Form coming soon)</p>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="gradient-border">
        <div className="gradient-border-content">
          {loading && <div className="text-center py-8">Loading invoices...</div>}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}
          {!loading && !error && invoices.length === 0 && (
            <div className="text-center py-8 text-secondary-700">No invoices found.</div>
          )}
          {!loading && !error && invoices.length > 0 && (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-4">Invoice #</th>
                  <th className="text-left py-2 px-4">Client</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Total</th>
                  <th className="text-left py-2 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} className="border-t">
                    <td className="py-2 px-4 font-semibold">{inv.invoiceNumber}</td>
                    <td className="py-2 px-4">{inv.clientId}</td>
                    <td className="py-2 px-4">{inv.status}</td>
                    <td className="py-2 px-4">${inv.totalAmount.toLocaleString()}</td>
                    <td className="py-2 px-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage; 