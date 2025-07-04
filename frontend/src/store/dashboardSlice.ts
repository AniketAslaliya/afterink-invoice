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

const initialStats = {
  totalClients: 0,
  totalProjects: 0,
  totalInvoices: 0,
  totalRevenue: 0,
  pendingInvoices: 0,
  overdueInvoices: 0,
  paidInvoices: 0,
  monthlyRevenue: 0,
  monthlyGrowth: 0,
  averageInvoiceValue: 0,
  paymentRate: 0,
};

// Add currencyToINR utility (mock rates, same as ReportsPage)
const currencyToINR = (amount: number, currency: string): number => {
  if (currency === 'INR') return amount;
  const rates: Record<string, number> = {
    USD: 83,
    EUR: 90,
    GBP: 105,
    CAD: 61,
    AUD: 55,
    INR: 1,
  };
  return amount * (rates[currency] || 1);
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: initialStats,
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
        const { clients, projects, invoices } = action.payload;
        // Defensive: always arrays
        const safeClients = Array.isArray(clients) ? clients : [];
        const safeProjects = Array.isArray(projects) ? projects : [];
        const safeInvoices = Array.isArray(invoices) ? invoices : [];

        // Calculate stats
        const totalRevenue = safeInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + currencyToINR(inv.totalAmount || 0, inv.currency || 'INR'), 0);
        const paidInvoices = safeInvoices.filter(inv => inv.status === 'paid');
        const pendingInvoices = safeInvoices.filter(inv => inv.status === 'pending');
        const overdueInvoices = safeInvoices.filter(inv => {
          const dueDate = new Date(inv.dueDate);
          return inv.status === 'pending' && dueDate < new Date();
        });

        // Monthly calculations
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyInvoices = safeInvoices.filter(inv => {
          const invDate = new Date(inv.createdAt);
          return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

        // Previous month for growth calculation
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonthInvoices = safeInvoices.filter(inv => {
          const invDate = new Date(inv.createdAt);
          return invDate.getMonth() === prevMonth && invDate.getFullYear() === prevYear;
        });
        const prevMonthRevenue = prevMonthInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const monthlyGrowth = prevMonthRevenue > 0 ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

        state.stats = {
          totalClients: safeClients.length,
          totalProjects: safeProjects.length,
          totalInvoices: safeInvoices.length,
          totalRevenue: isNaN(totalRevenue) ? 0 : totalRevenue,
          pendingInvoices: pendingInvoices.length,
          overdueInvoices: overdueInvoices.length,
          paidInvoices: paidInvoices.length,
          monthlyRevenue: isNaN(monthlyRevenue) ? 0 : monthlyRevenue,
          monthlyGrowth: isNaN(monthlyGrowth) ? 0 : monthlyGrowth,
          averageInvoiceValue: safeInvoices.length > 0 ? totalRevenue / safeInvoices.length : 0,
          paymentRate: safeInvoices.length > 0 ? (paidInvoices.length / safeInvoices.length) * 100 : 0,
        };
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard stats';
      });
  },
});

export default dashboardSlice.reducer; 