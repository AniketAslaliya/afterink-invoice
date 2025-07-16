import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpenses } from '../store/expensesSlice';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, Filter, Receipt, BarChart3 } from 'lucide-react';

const ExpensesPage = () => {
  const dispatch = useDispatch();
  const { expenses, loading, error } = useSelector((state: any) => state.expenses);
  const [reasons, setReasons] = useState<any[]>([]);
  const [form, setForm] = useState({ reasonId: '', amount: '', date: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ reasonId: '', amount: '', date: '', description: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ reasonId: '', startDate: '', endDate: '', minAmount: '', maxAmount: '', search: '' });
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    dispatch(fetchExpenses() as any);
    apiGet('/expense-reasons').then(res => setReasons(res.data || res)).catch(() => setReasons([]));
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/expenses', { ...form, amount: Number(form.amount) });
      setForm({ reasonId: '', amount: '', date: '', description: '' });
      setShowAdd(false);
      dispatch(fetchExpenses() as any);
    } catch (err) {
      alert('Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense: any) => {
    setEditId(expense._id);
    setEditForm({
      reasonId: expense.reasonId?._id || expense.reasonId,
      amount: expense.amount,
      date: expense.date ? expense.date.slice(0, 10) : '',
      description: expense.description || '',
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await apiPut(`/expenses/${editId}`, { ...editForm, amount: Number(editForm.amount) });
      setEditId(null);
      dispatch(fetchExpenses() as any);
    } catch (err) {
      alert('Failed to update expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setDeletingId(id);
    try {
      await apiDelete(`/expenses/${id}`);
      dispatch(fetchExpenses() as any);
    } catch (err) {
      alert('Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  const canEditOrDelete = (e: any) => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager' || e.createdBy === user._id;
  };

  // Filtering and searching
  const filteredExpenses = expenses.filter((e: any) => {
    const reasonMatch = !filters.reasonId || (e.reasonId?._id || e.reasonId) === filters.reasonId;
    const date = e.date ? new Date(e.date) : null;
    const startDateMatch = !filters.startDate || (date && date >= new Date(filters.startDate));
    const endDateMatch = !filters.endDate || (date && date <= new Date(filters.endDate));
    const minAmountMatch = !filters.minAmount || e.amount >= Number(filters.minAmount);
    const maxAmountMatch = !filters.maxAmount || e.amount <= Number(filters.maxAmount);
    const searchMatch = !filters.search || (
      (e.description || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (e.reasonId?.name || '').toLowerCase().includes(filters.search.toLowerCase())
    );
    return reasonMatch && startDateMatch && endDateMatch && minAmountMatch && maxAmountMatch && searchMatch;
  });

  // Summary stats
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const thisMonthExpenses = expenses.filter((e: any) => {
    const d = e.date ? new Date(e.date) : null;
    const now = new Date();
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2"><Receipt className="inline-block text-red-400" /> Expenses</h1>
              <p className="text-gray-300 mt-2">Track all business expenses and their impact on revenue.</p>
            </div>
            <button onClick={() => setShowAdd((v) => !v)} className="btn btn-primary group">
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-800 to-red-600 rounded-2xl p-6 border border-red-700 flex items-center gap-4 shadow-lg">
          <Receipt className="text-white bg-red-500 rounded-full p-2" size={40} />
          <div>
            <div className="text-white text-lg font-bold">Total Expenses</div>
            <div className="text-2xl text-red-200 font-bold">₹{totalExpenses.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-800 to-purple-600 rounded-2xl p-6 border border-purple-700 flex items-center gap-4 shadow-lg">
          <BarChart3 className="text-white bg-purple-500 rounded-full p-2" size={40} />
          <div>
            <div className="text-white text-lg font-bold">This Month</div>
            <div className="text-2xl text-purple-200 font-bold">₹{thisMonthExpenses.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-700 flex items-center gap-4 shadow-lg">
          <Search className="text-white bg-gray-500 rounded-full p-2" size={40} />
          <div>
            <div className="text-white text-lg font-bold">Expenses Found</div>
            <div className="text-2xl text-gray-200 font-bold">{filteredExpenses.length}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-600 mb-8">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400 text-base"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select name="reasonId" value={filters.reasonId} onChange={e => setFilters(f => ({ ...f, reasonId: e.target.value }))} className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-white text-base">
              <option value="">All Reasons</option>
              {reasons.map((r: any) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
            <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-white text-base" />
            <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-white text-base" />
            <input type="number" value={filters.minAmount} onChange={e => setFilters(f => ({ ...f, minAmount: e.target.value }))} className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-white text-base" placeholder="Min Amount" />
            <input type="number" value={filters.maxAmount} onChange={e => setFilters(f => ({ ...f, maxAmount: e.target.value }))} className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-white text-base" placeholder="Max Amount" />
          </div>
        </div>
      </div>

      {/* Add Expense Form (collapsible) */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <select name="reasonId" value={form.reasonId} onChange={handleChange} required className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white" disabled={reasons.length === 0}>
            <option value="">{reasons.length === 0 ? 'No reasons available' : 'Select Reason'}</option>
            {reasons.map((r: any) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
          <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Amount" required className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white" />
          <input name="date" type="date" value={form.date} onChange={handleChange} required className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white" />
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white" />
          <button type="submit" disabled={submitting || reasons.length === 0} className="col-span-1 md:col-span-5 btn btn-primary mt-2">{submitting ? 'Adding...' : 'Add Expense'}</button>
          {reasons.length === 0 && (
            <div className="col-span-1 md:col-span-5 text-yellow-400 text-sm mt-2">No expense reasons found. Please add one in the Expense Reasons page.</div>
          )}
        </form>
      )}

      {/* Table/List of Expenses */}
      <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-lg overflow-x-auto">
        <table className="min-w-full bg-gray-900 text-white">
          <thead>
            <tr>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Reason</th>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Amount</th>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Date</th>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Description</th>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((e: any) => (
              <tr key={e._id} className="hover:bg-gray-800 transition-colors">
                {editId === e._id ? (
                  <>
                    <td className="border-b border-gray-800 px-4 py-2">
                      <select name="reasonId" value={editForm.reasonId} onChange={handleEditChange} required className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white">
                        <option value="">Select Reason</option>
                        {reasons.map((r: any) => (
                          <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-gray-800 px-4 py-2"><input name="amount" type="number" value={editForm.amount} onChange={handleEditChange} className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white" /></td>
                    <td className="border-b border-gray-800 px-4 py-2"><input name="date" type="date" value={editForm.date} onChange={handleEditChange} className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white" /></td>
                    <td className="border-b border-gray-800 px-4 py-2"><input name="description" value={editForm.description} onChange={handleEditChange} className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white" /></td>
                    <td className="border-b border-gray-800 px-4 py-2">
                      <button onClick={handleEditSubmit} className="btn btn-primary mr-2">Save</button>
                      <button onClick={() => setEditId(null)} className="btn btn-outline">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border-b border-gray-800 px-4 py-2">{e.reasonId?.name || e.reasonId}</td>
                    <td className="border-b border-gray-800 px-4 py-2">₹{e.amount}</td>
                    <td className="border-b border-gray-800 px-4 py-2">{e.date ? new Date(e.date).toLocaleDateString() : ''}</td>
                    <td className="border-b border-gray-800 px-4 py-2">{e.description}</td>
                    <td className="border-b border-gray-800 px-4 py-2">
                      {canEditOrDelete(e) && (
                        <>
                          <button onClick={() => handleEdit(e)} className="btn btn-outline mr-2">Edit</button>
                          <button onClick={() => handleDelete(e._id)} className="btn btn-outline text-red-500" disabled={deletingId === e._id}>{deletingId === e._id ? 'Deleting...' : 'Delete'}</button>
                        </>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesPage; 