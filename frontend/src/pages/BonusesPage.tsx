import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBonuses } from '../store/bonusesSlice';
import { fetchClients } from '../store/clientsSlice';
import { apiPost, apiPut, apiDelete } from '../api';
import { useAuthStore } from '../store/authStore';

const BonusesPage = () => {
  const dispatch = useDispatch();
  const { bonuses, loading, error } = useSelector((state: any) => state.bonuses);
  const { clients } = useSelector((state: any) => state.clients);
  const [form, setForm] = useState({ clientId: '', amount: '', date: '', description: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ clientId: '', amount: '', date: '', description: '', category: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ clientId: '', startDate: '', endDate: '', minAmount: '', maxAmount: '', category: '' });
  const { user } = useAuthStore();

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

  const filteredBonuses = bonuses.filter((b: any) => {
    const clientMatch = !filters.clientId || (b.clientId?._id || b.clientId) === filters.clientId;
    const categoryMatch = !filters.category || (b.category || '').toLowerCase().includes(filters.category.toLowerCase());
    const date = b.date ? new Date(b.date) : null;
    const startDateMatch = !filters.startDate || (date && date >= new Date(filters.startDate));
    const endDateMatch = !filters.endDate || (date && date <= new Date(filters.endDate));
    const minAmountMatch = !filters.minAmount || b.amount >= Number(filters.minAmount);
    const maxAmountMatch = !filters.maxAmount || b.amount <= Number(filters.maxAmount);
    return clientMatch && categoryMatch && startDateMatch && endDateMatch && minAmountMatch && maxAmountMatch;
  });

  const canEditOrDelete = (b: any) => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager' || b.createdBy === user._id;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bonuses</h1>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-4">
        <select name="clientId" value={filters.clientId} onChange={e => setFilters(f => ({ ...f, clientId: e.target.value }))} className="p-2 border rounded">
          <option value="">All Clients</option>
          {clients.map((c: any) => (
            <option key={c._id} value={c._id}>{c.companyName}</option>
          ))}
        </select>
        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="p-2 border rounded" placeholder="Start Date" />
        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="p-2 border rounded" placeholder="End Date" />
        <input type="number" value={filters.minAmount} onChange={e => setFilters(f => ({ ...f, minAmount: e.target.value }))} className="p-2 border rounded" placeholder="Min Amount" />
        <input type="number" value={filters.maxAmount} onChange={e => setFilters(f => ({ ...f, maxAmount: e.target.value }))} className="p-2 border rounded" placeholder="Max Amount" />
        <input type="text" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="p-2 border rounded" placeholder="Category" />
      </div>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
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
      {loading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Client</th>
              <th className="border px-4 py-2">Amount</th>
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Category</th>
              <th className="border px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredBonuses.map((b: any) => (
              <tr key={b._id}>
                {editId === b._id ? (
                  <>
                    <td className="border px-4 py-2">
                      <select name="clientId" value={editForm.clientId} onChange={handleEditChange} required className="p-2 border rounded">
                        <option value="">Select Client</option>
                        {clients.map((c: any) => (
                          <option key={c._id} value={c._id}>{c.companyName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-4 py-2"><input name="amount" type="number" value={editForm.amount} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border px-4 py-2"><input name="date" type="date" value={editForm.date} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border px-4 py-2"><input name="category" value={editForm.category} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border px-4 py-2"><input name="description" value={editForm.description} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border px-4 py-2">
                      <button onClick={handleEditSubmit} className="bg-green-600 text-white px-2 py-1 rounded mr-2">Save</button>
                      <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-2 py-1 rounded">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border px-4 py-2">{b.clientId?.companyName || b.clientId}</td>
                    <td className="border px-4 py-2">{b.amount}</td>
                    <td className="border px-4 py-2">{b.date ? new Date(b.date).toLocaleDateString() : ''}</td>
                    <td className="border px-4 py-2">{b.category}</td>
                    <td className="border px-4 py-2">{b.description}</td>
                    <td className="border px-4 py-2">
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
      )}
    </div>
  );
};

export default BonusesPage; 