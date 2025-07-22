import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import { Plus, Search, List, Edit, Trash2, Save, X } from 'lucide-react';

const ExpenseReasonsPage = () => {
  const [reasons, setReasons] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const fetchReasons = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/expense-reasons');
      setReasons(res.data || res);
    } catch {
      setReasons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReasons();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await apiPost('/expense-reasons', form);
      setForm({ name: '', description: '' });
      setShowAdd(false);
      fetchReasons();
    } catch {
      setErrorMsg('Failed to add reason. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (reason: any) => {
    setEditId(reason._id);
    setEditForm({ name: reason.name, description: reason.description || '' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSubmitting(true);
    try {
      await apiPut(`/expense-reasons/${editId}`, editForm);
      setEditId(null);
      fetchReasons();
    } catch {
      alert('Failed to update reason');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reason?')) return;
    setDeletingId(id);
    try {
      await apiDelete(`/expense-reasons/${id}`);
      fetchReasons();
    } catch {
      alert('Failed to delete reason');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter reasons based on search term
  const filteredReasons = reasons.filter((reason) =>
    reason.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reason.description && reason.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2"><List className="inline-block text-blue-400" /> Expense Reasons</h1>
              <p className="text-gray-300 mt-2">Manage and organize expense categories for better financial tracking.</p>
            </div>
            <button onClick={() => setShowAdd((v) => !v)} className="btn btn-primary group">
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Add Reason
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-800 to-blue-600 rounded-2xl p-6 border border-blue-700 flex items-center gap-4 shadow-lg">
          <List className="text-white bg-blue-500 rounded-full p-2" size={40} />
          <div>
            <div className="text-white text-lg font-bold">Total Reasons</div>
            <div className="text-2xl text-blue-200 font-bold">{reasons.length}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-800 to-green-600 rounded-2xl p-6 border border-green-700 flex items-center gap-4 shadow-lg">
          <Search className="text-white bg-green-500 rounded-full p-2" size={40} />
          <div>
            <div className="text-white text-lg font-bold">Active Reasons</div>
            <div className="text-2xl text-green-200 font-bold">{filteredReasons.length}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-800 to-purple-600 rounded-2xl p-6 border border-purple-700 flex items-center gap-4 shadow-lg">
          <Edit className="text-white bg-purple-500 rounded-full p-2" size={40} />
          <div>
            <div className="text-white text-lg font-bold">Recently Added</div>
            <div className="text-2xl text-purple-200 font-bold">{reasons.filter(r => {
              const date = new Date(r.createdAt);
              const now = new Date();
              return date.getTime() > now.getTime() - (7 * 24 * 60 * 60 * 1000); // Last 7 days
            }).length}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-600 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search expense reasons..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-base"
          />
        </div>
      </div>

      {/* Add Reason Form (collapsible) */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="Reason Name" 
              required 
              className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400" 
            />
            <input 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              placeholder="Description" 
              className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400" 
            />
            <button 
              type="submit" 
              disabled={submitting} 
              className="btn btn-primary"
            >
              {submitting ? 'Adding...' : 'Add Reason'}
            </button>
          </div>
          {errorMsg && <div className="text-red-400 mt-2 text-sm">{errorMsg}</div>}
        </form>
      )}

      {/* Table/List of Expense Reasons */}
      <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-lg overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-400">Loading expense reasons...</div>
          </div>
        ) : (
          <table className="min-w-full bg-gray-900 text-white">
            <thead>
              <tr>
                <th className="border-b border-gray-700 px-4 py-3 text-left">Name</th>
                <th className="border-b border-gray-700 px-4 py-3 text-left">Description</th>
                <th className="border-b border-gray-700 px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReasons.map((r: any) => (
                <tr key={r._id} className="hover:bg-gray-800 transition-colors">
                  {editId === r._id ? (
                    <>
                      <td className="border-b border-gray-800 px-4 py-3">
                        <input 
                          name="name" 
                          value={editForm.name} 
                          onChange={handleEditChange} 
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white" 
                        />
                      </td>
                      <td className="border-b border-gray-800 px-4 py-3">
                        <input 
                          name="description" 
                          value={editForm.description} 
                          onChange={handleEditChange} 
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white" 
                        />
                      </td>
                      <td className="border-b border-gray-800 px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={handleEditSubmit} 
                            className="btn btn-primary btn-sm"
                            disabled={submitting}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {submitting ? 'Saving...' : 'Save'}
                          </button>
                          <button 
                            onClick={() => setEditId(null)} 
                            className="btn btn-outline btn-sm"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border-b border-gray-800 px-4 py-3 font-medium">{r.name}</td>
                      <td className="border-b border-gray-800 px-4 py-3 text-gray-300">{r.description || '-'}</td>
                      <td className="border-b border-gray-800 px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(r)} 
                            className="btn btn-outline btn-sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(r._id)} 
                            className="btn btn-outline btn-sm text-red-400 hover:text-red-300" 
                            disabled={deletingId === r._id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingId === r._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredReasons.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-400">
              {searchTerm ? 'No expense reasons found matching your search.' : 'No expense reasons found. Add your first one!'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseReasonsPage; 