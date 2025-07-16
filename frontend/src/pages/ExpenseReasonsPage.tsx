import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';

const ExpenseReasonsPage = () => {
  const [reasons, setReasons] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    try {
      await apiPost('/expense-reasons', form);
      setForm({ name: '', description: '' });
      fetchReasons();
    } catch {
      alert('Failed to add reason');
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Expense Reasons</h1>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Reason Name" required className="p-2 border rounded" />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="p-2 border rounded" />
        <button type="submit" disabled={submitting} className="bg-blue-600 text-white p-2 rounded">{submitting ? 'Adding...' : 'Add Reason'}</button>
      </form>
      {loading ? <p>Loading...</p> : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reasons.map((r: any) => (
              <tr key={r._id}>
                {editId === r._id ? (
                  <>
                    <td className="border px-4 py-2"><input name="name" value={editForm.name} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border px-4 py-2"><input name="description" value={editForm.description} onChange={handleEditChange} className="p-2 border rounded" /></td>
                    <td className="border px-4 py-2">
                      <button onClick={handleEditSubmit} className="bg-green-600 text-white px-2 py-1 rounded mr-2">Save</button>
                      <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-2 py-1 rounded">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border px-4 py-2">{r.name}</td>
                    <td className="border px-4 py-2">{r.description}</td>
                    <td className="border px-4 py-2">
                      <button onClick={() => handleEdit(r)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                      <button onClick={() => handleDelete(r._id)} className="bg-red-600 text-white px-2 py-1 rounded" disabled={deletingId === r._id}>{deletingId === r._id ? 'Deleting...' : 'Delete'}</button>
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

export default ExpenseReasonsPage; 