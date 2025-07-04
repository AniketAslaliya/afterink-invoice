import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPut } from '../api';

export const fetchInvoices = createAsyncThunk('invoices/fetchInvoices', async ({ page = 1, limit = 20 }: { page?: number, limit?: number } = {}) => {
  const res = await apiGet(`/invoices?page=${page}&limit=${limit}`);
  return {
    invoices: res.data?.invoices || res.invoices || res || [],
    pagination: res.data?.pagination || res.pagination || { page, limit, total: 0, pages: 1 }
  };
});

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: {
    invoices: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 1 },
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch invoices';
      });
  },
});

export default invoicesSlice.reducer; 