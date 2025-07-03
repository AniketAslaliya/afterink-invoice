import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../api';

export const fetchClients = createAsyncThunk('clients/fetchClients', async () => {
  const res = await apiGet('/clients');
  return res.data?.clients || res.clients || res || [];
});

const clientsSlice = createSlice({
  name: 'clients',
  initialState: {
    clients: [],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch clients';
      });
  },
});

export default clientsSlice.reducer; 