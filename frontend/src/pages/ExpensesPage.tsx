import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpenses } from '../store/expensesSlice';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';

const ExpensesPage = () => {
  const dispatch = useDispatch();
  const { expenses, loading, error } = useSelector((state: any) => state.expenses);
  const [reasons, setReasons] = useState<any[]>([]);
  const [form, setForm] = useState({ reasonId: '', amount: '', date: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ reasonId: '', amount: '', date: '', description: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
                {editId === e._id ? (
                  <>
                    <td className="border px-4 py-2">
                      <select name="reasonId" value={editForm.reasonId} onChange={handleEditChange} required className="p-2 border rounded">
                        <option value="">Select Reason</option>
                        {reasons.map((r: any) => (
                          <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-4 py-2"><input name="amount" type="number" value={editForm.amount} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border px-4 py-2"><input name="date" type="date" value={editForm.date} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border px-4 py-2"><input name="description" value={editForm.description} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border px-4 py-2">
                      <button onClick={handleEditSubmit} className="bg-green-600 text-white px-2 py-1 rounded mr-2">Save</button>
                      <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-2 py-1 rounded">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border px-4 py-2">{e.reasonId?.name || e.reasonId}</td>
                    <td className="border px-4 py-2">{e.amount}</td>
                    <td className="border px-4 py-2">{e.date ? new Date(e.date).toLocaleDateString() : ''}</td>
                    <td className="border px-4 py-2">{e.description}</td>
                    <td className="border px-4 py-2">
                      <button onClick={() => handleEdit(e)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                      <button onClick={() => handleDelete(e._id)} className="bg-red-600 text-white px-2 py-1 rounded" disabled={deletingId === e._id}>{deletingId === e._id ? 'Deleting...' : 'Delete'}</button>
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

export default ExpensesPage; 