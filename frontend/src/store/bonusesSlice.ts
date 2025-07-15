import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../api';

export const fetchBonuses = createAsyncThunk('bonuses/fetchBonuses', async () => {
  const res = await apiGet('/bonuses');
  return res.data || res.bonuses || res || [];
});

const bonusesSlice = createSlice({
  name: 'bonuses',
  initialState: {
    bonuses: [],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBonuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBonuses.fulfilled, (state, action) => {
        state.loading = false;
        state.bonuses = action.payload;
      })
      .addCase(fetchBonuses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch bonuses';
      });
  },
});

export default bonusesSlice.reducer; 