import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBonuses } from '../store/bonusesSlice';
import { fetchClients } from '../store/clientsSlice';
import { apiPost, apiPut, apiDelete } from '../api';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, Filter, Gift, BarChart3 } from 'lucide-react';

const BonusesPage = () => {
  const dispatch = useDispatch();
  const { bonuses, loading, error } = useSelector((state: any) => state.bonuses);
  const { clients } = useSelector((state: any) => state.clients);
  const [form, setForm] = useState({ clientId: '', amount: '', date: '', description: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ clientId: '', amount: '', date: '', description: '', category: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ clientId: '', startDate: '', endDate: '', minAmount: '', maxAmount: '', category: '', search: '' });
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    dispatch(fetchBonuses() as any);
    dispatch(fetchClients() as any);
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/bonuses', { ...form, amount: Number(form.amount) });
      setForm({ clientId: '', amount: '', date: '', description: '', category: '' });
      setShowAdd(false);
      dispatch(fetchBonuses() as any);
    } catch (err) {
      alert('Failed to add bonus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (bonus: any) => {
    setEditId(bonus._id);
    setEditForm({
      clientId: bonus.clientId?._id || bonus.clientId,
      amount: bonus.amount,
      date: bonus.date ? bonus.date.slice(0, 10) : '',
      description: bonus.description || '',
      category: bonus.category || '',
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await apiPut(`/bonuses/${editId}`, { ...editForm, amount: Number(editForm.amount) });
      setEditId(null);
      dispatch(fetchBonuses() as any);
    } catch (err) {
      alert('Failed to update bonus');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bonus?')) return;
    setDeletingId(id);
    try {
      await apiDelete(`/bonuses/${id}`);
      dispatch(fetchBonuses() as any);
    } catch (err) {
      alert('Failed to delete bonus');
    } finally {
      setDeletingId(null);
    }
  };

  const canEditOrDelete = (b: any) => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager' || b.createdBy === user._id;
  };

  // Filtering and searching
  const filteredBonuses = bonuses.filter((b: any) => {
    const clientMatch = !filters.clientId || (b.clientId?._id || b.clientId) === filters.clientId;
    const categoryMatch = !filters.category || (b.category || '').toLowerCase().includes(filters.category.toLowerCase());
    const date = b.date ? new Date(b.date) : null;
    const startDateMatch = !filters.startDate || (date && date >= new Date(filters.startDate));
    const endDateMatch = !filters.endDate || (date && date <= new Date(filters.endDate));
    const minAmountMatch = !filters.minAmount || b.amount >= Number(filters.minAmount);
    const maxAmountMatch = !filters.maxAmount || b.amount <= Number(filters.maxAmount);
    const searchMatch = !filters.search || (
      (b.description || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (b.category || '').toLowerCase().includes(filters.search.toLowerCase())
    );
    return clientMatch && categoryMatch && startDateMatch && endDateMatch && minAmountMatch && maxAmountMatch && searchMatch;
  });

  // Summary stats
  const totalBonuses = bonuses.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
  const thisMonthBonuses = bonuses.filter((b: any) => {
    const d = b.date ? new Date(b.date) : null;
    const now = new Date();
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2"><Gift className="inline-block text-blue-400" /> Bonuses</h1>
          <p className="text-gray-400">Track all bonuses given to clients and their impact on revenue.</p>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-md">
          <Plus size={18} /> Add Bonus
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-800 to-blue-600 rounded-xl p-6 flex items-center gap-4 shadow-lg">
          <Gift className="text-white bg-blue-500 rounded-full p-2" size={40} />
          <div>
            <div className="text-white text-lg font-bold">Total Bonuses</div>
            <div className="text-2xl text-blue-200 font-bold">₹{totalBonuses.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-800 to-purple-600 rounded-xl p-6 flex items-center gap-4 shadow-lg">
          <BarChart3 className="text-white bg-purple-500 rounded-full p-2" size={40} />
          <div>
            <div className="text-white text-lg font-bold">This Month</div>
            <div className="text-2xl text-purple-200 font-bold">₹{thisMonthBonuses.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 flex items-center gap-4 shadow-lg">
          <Search className="text-white bg-gray-500 rounded-full p-2" size={40} />
          <div>
            <div className="text-white text-lg font-bold">Bonuses Found</div>
            <div className="text-2xl text-gray-200 font-bold">{filteredBonuses.length}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="flex flex-1 gap-2">
          <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search bonuses..." className="p-2 border rounded w-full md:w-64" />
          <select name="clientId" value={filters.clientId} onChange={e => setFilters(f => ({ ...f, clientId: e.target.value }))} className="p-2 border rounded">
            <option value="">All Clients</option>
            {clients.map((c: any) => (
              <option key={c._id} value={c._id}>{c.companyName}</option>
            ))}
          </select>
          <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="p-2 border rounded" />
          <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="p-2 border rounded" />
          <input type="number" value={filters.minAmount} onChange={e => setFilters(f => ({ ...f, minAmount: e.target.value }))} className="p-2 border rounded" placeholder="Min Amount" />
          <input type="number" value={filters.maxAmount} onChange={e => setFilters(f => ({ ...f, maxAmount: e.target.value }))} className="p-2 border rounded" placeholder="Max Amount" />
          <input type="text" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="p-2 border rounded" placeholder="Category" />
        </div>
      </div>

      {/* Add Bonus Form (collapsible) */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-800 p-4 rounded-xl shadow-lg">
          <select name="clientId" value={form.clientId} onChange={handleChange} required className="p-2 border rounded">
            <option value="">Select Client</option>
            {clients.map((c: any) => (
              <option key={c._id} value={c._id}>{c.companyName}</option>
            ))}
          </select>
          <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Amount" required className="p-2 border rounded" />
          <input name="date" type="date" value={form.date} onChange={handleChange} required className="p-2 border rounded" />
          <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="p-2 border rounded" />
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="p-2 border rounded" />
          <button type="submit" disabled={submitting} className="col-span-1 md:col-span-5 bg-blue-600 text-white p-2 rounded mt-2">{submitting ? 'Adding...' : 'Add Bonus'}</button>
        </form>
      )}

      {/* Table/List of Bonuses */}
      <div className="bg-gray-900 rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full bg-gray-900 text-white">
          <thead>
            <tr>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Client</th>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Amount</th>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Date</th>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Category</th>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Description</th>
              <th className="border-b border-gray-700 px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBonuses.map((b: any) => (
              <tr key={b._id} className="hover:bg-gray-800 transition-colors">
                {editId === b._id ? (
                  <>
                    <td className="border-b border-gray-800 px-4 py-2">
                      <select name="clientId" value={editForm.clientId} onChange={handleEditChange} required className="p-2 border rounded">
                        <option value="">Select Client</option>
                        {clients.map((c: any) => (
                          <option key={c._id} value={c._id}>{c.companyName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-gray-800 px-4 py-2"><input name="amount" type="number" value={editForm.amount} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border-b border-gray-800 px-4 py-2"><input name="date" type="date" value={editForm.date} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border-b border-gray-800 px-4 py-2"><input name="category" value={editForm.category} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border-b border-gray-800 px-4 py-2"><input name="description" value={editForm.description} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border-b border-gray-800 px-4 py-2">
                      <button onClick={handleEditSubmit} className="bg-green-600 text-white px-2 py-1 rounded mr-2">Save</button>
                      <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-2 py-1 rounded">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border-b border-gray-800 px-4 py-2">{b.clientId?.companyName || b.clientId}</td>
                    <td className="border-b border-gray-800 px-4 py-2">₹{b.amount}</td>
                    <td className="border-b border-gray-800 px-4 py-2">{b.date ? new Date(b.date).toLocaleDateString() : ''}</td>
                    <td className="border-b border-gray-800 px-4 py-2">{b.category}</td>
                    <td className="border-b border-gray-800 px-4 py-2">{b.description}</td>
                    <td className="border-b border-gray-800 px-4 py-2">
                      {canEditOrDelete(b) && (
                        <>
                          <button onClick={() => handleEdit(b)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                          <button onClick={() => handleDelete(b._id)} className="bg-red-600 text-white px-2 py-1 rounded" disabled={deletingId === b._id}>{deletingId === b._id ? 'Deleting...' : 'Delete'}</button>
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

export default BonusesPage; 