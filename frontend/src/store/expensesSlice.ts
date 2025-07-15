import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../api';

export const fetchExpenses = createAsyncThunk('expenses/fetchExpenses', async () => {
  const res = await apiGet('/expenses');
  return res.data || res.expenses || res || [];
});

const expensesSlice = createSlice({
  name: 'expenses',
  initialState: {
    expenses: [],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expenses';
      });
  },
});

export default expensesSlice.reducer; 