import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpenses } from '../store/expensesSlice';
import { apiGet, apiPost } from '../api';

const ExpensesPage = () => {
  const dispatch = useDispatch();
  const { expenses, loading, error } = useSelector((state: any) => state.expenses);
  const [reasons, setReasons] = useState<any[]>([]);
  const [form, setForm] = useState({ reasonId: '', amount: '', date: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

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
      dispatch(fetchExpenses() as any);
    } catch (err) {
      alert('Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Expenses</h1>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select name="reasonId" value={form.reasonId} onChange={handleChange} required className="p-2 border rounded">
          <option value="">Select Reason</option>
          {reasons.map((r: any) => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>
        <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Amount" required className="p-2 border rounded" />
        <input name="date" type="date" value={form.date} onChange={handleChange} required className="p-2 border rounded" />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="p-2 border rounded" />
        <button type="submit" disabled={submitting} className="col-span-1 md:col-span-4 bg-blue-600 text-white p-2 rounded mt-2">{submitting ? 'Adding...' : 'Add Expense'}</button>
      </form>
      {loading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Reason</th>
              <th className="border px-4 py-2">Amount</th>
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e: any) => (
              <tr key={e._id}>
                <td className="border px-4 py-2">{e.reasonId?.name || e.reasonId}</td>
                <td className="border px-4 py-2">{e.amount}</td>
                <td className="border px-4 py-2">{e.date ? new Date(e.date).toLocaleDateString() : ''}</td>
                <td className="border px-4 py-2">{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExpensesPage; 