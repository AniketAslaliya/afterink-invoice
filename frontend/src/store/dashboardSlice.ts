import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../api';

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchDashboardStats', async () => {
  const [clientsRes, projectsRes, invoicesRes] = await Promise.all([
    apiGet('/clients'),
    apiGet('/projects'),
    apiGet('/invoices'),
  ]);
  return {
    clients: clientsRes.data?.clients || clientsRes.clients || [],
    projects: projectsRes.data?.projects || projectsRes.projects || [],
    invoices: invoicesRes.data?.invoices || invoicesRes.invoices || [],
  };
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null as { clients: any; projects: any; invoices: any } | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard stats';
      });
  },
});

export default dashboardSlice.reducer; 