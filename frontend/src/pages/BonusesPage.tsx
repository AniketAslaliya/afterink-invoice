import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBonuses } from '../store/bonusesSlice';
import { fetchClients } from '../store/clientsSlice';
import { apiPost } from '../api';

const BonusesPage = () => {
  const dispatch = useDispatch();
  const { bonuses, loading, error } = useSelector((state: any) => state.bonuses);
  const { clients } = useSelector((state: any) => state.clients);
  const [form, setForm] = useState({ clientId: '', amount: '', date: '', description: '', category: '' });
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bonuses</h1>
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
            {bonuses.map((b: any) => (
              <tr key={b._id}>
                <td className="border px-4 py-2">{b.clientId?.companyName || b.clientId}</td>
                <td className="border px-4 py-2">{b.amount}</td>
                <td className="border px-4 py-2">{b.date ? new Date(b.date).toLocaleDateString() : ''}</td>
                <td className="border px-4 py-2">{b.category}</td>
                <td className="border px-4 py-2">{b.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BonusesPage; 