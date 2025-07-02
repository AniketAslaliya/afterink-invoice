/**
 * Dashboard Page Component
 * 
 * The main dashboard page that provides an overview of the user's business.
 * Features include:
 * - Real-time statistics (clients, invoices, projects, revenue)
 * - Quick action buttons for common tasks
 * - Recent activity feed
 * - Responsive design with animated elements
 * 
 * This component fetches data from multiple API endpoints and presents
 * a comprehensive business overview with interactive elements.
 * 
 * @author Afterink Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  DollarSign, 
  PlusCircle,
  ArrowRight,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,

  Zap,
  Briefcase
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiGet } from '../api';
import { useNavigate } from 'react-router-dom';
// Dashboard layout is handled by App.tsx routing

interface DashboardStats {
  totalClients: number;
  totalProjects: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  paidInvoices: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  averageInvoiceValue: number;
  paymentRate: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
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
    paymentRate: 0
  });

  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [clientsRes, projectsRes, invoicesRes] = await Promise.all([
      apiGet('/clients'),
        apiGet('/projects'),
        apiGet('/invoices')
      ]);

      const clients = clientsRes.data;
      const projects = projectsRes.data;
      const invoices = invoicesRes.data;

      // Calculate stats
      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
      const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid');
      const pendingInvoices = invoices.filter((inv: any) => inv.status === 'pending');
      const overdueInvoices = invoices.filter((inv: any) => {
        const dueDate = new Date(inv.dueDate);
        return inv.status === 'pending' && dueDate < new Date();
      });

      // Monthly calculations
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      });
      const monthlyRevenue = monthlyInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);

      // Previous month for growth calculation
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonthInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        return invDate.getMonth() === prevMonth && invDate.getFullYear() === prevYear;
      });
      const prevMonthRevenue = prevMonthInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
      const monthlyGrowth = prevMonthRevenue > 0 ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

        setStats({
        totalClients: clients.length,
        totalProjects: projects.length,
        totalInvoices: invoices.length,
        totalRevenue,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: overdueInvoices.length,
        paidInvoices: paidInvoices.length,
        monthlyRevenue,
        monthlyGrowth,
        averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        paymentRate: invoices.length > 0 ? (paidInvoices.length / invoices.length) * 100 : 0
      });

      // Get recent invoices
      const recent = invoices
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentInvoices(recent);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.message?.includes('Access token') || error.message?.includes('Failed to fetch') || error.message?.includes('401')) {
        setError('🔒 Please log in to view dashboard');
      } else {
        setError(error.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && error.includes('🔒')) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <div className="text-yellow-400 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-8 border border-gray-600 card-hover">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back! 👋</h1>
              <p className="text-gray-300 text-lg">Here's what's happening with your business today</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleNavigation('/invoices')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl btn-hover"
              >
                <PlusCircle size={20} />
                Create Invoice
              </button>
            </div>
        </div>
      </div>

        {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 card-hover stagger-item">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-600 p-3 rounded-xl">
                <DollarSign className="text-white" size={24} />
              </div>
              <div className="text-right">
                <p className="text-green-400 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
                  </div>
            <div className="flex items-center gap-2">
              {stats.monthlyGrowth >= 0 ? (
                <TrendingUp className="text-green-400" size={16} />
              ) : (
                <TrendingDown className="text-red-400" size={16} />
              )}
              <span className={`text-sm font-medium ${stats.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(stats.monthlyGrowth).toFixed(1)}% from last month
              </span>
                  </div>
                </div>

          {/* Total Invoices */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 card-hover stagger-item">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <FileText className="text-white" size={24} />
                </div>
              <div className="text-right">
                <p className="text-blue-400 text-sm font-medium">Total Invoices</p>
                <p className="text-2xl font-bold text-white">{stats.totalInvoices}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-400" size={16} />
              <span className="text-sm text-gray-300">
                {stats.paidInvoices} paid, {stats.pendingInvoices} pending
              </span>
      </div>
          </div>

          {/* Active Clients */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 card-hover stagger-item">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-600 p-3 rounded-xl">
                <Users className="text-white" size={24} />
              </div>
              <div className="text-right">
                <p className="text-purple-400 text-sm font-medium">Active Clients</p>
                <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="text-purple-400" size={16} />
              <span className="text-sm text-gray-300">
                {stats.totalProjects} total projects
              </span>
        </div>
          </div>

          {/* Payment Rate */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 card-hover stagger-item">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-600 p-3 rounded-xl">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div className="text-right">
                <p className="text-orange-400 text-sm font-medium">Payment Rate</p>
                <p className="text-2xl font-bold text-white">{stats.paymentRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="text-orange-400" size={16} />
              <span className="text-sm text-gray-300">
                Avg: {formatCurrency(stats.averageInvoiceValue)}
              </span>
        </div>
          </div>
        </div>

        {/* Business Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Status Overview */}
          <div className="lg:col-span-2 bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-600">
              <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Invoice Status Overview</h3>
              <button
                onClick={() => handleNavigation('/invoices')}
                className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-1"
              >
                View All <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-400" size={20} />
                  <div>
                    <p className="text-green-400 text-sm font-medium">Paid</p>
                    <p className="text-lg font-bold text-white">{stats.paidInvoices}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                <div className="flex items-center gap-3">
                  <Clock className="text-yellow-400" size={20} />
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Pending</p>
                    <p className="text-lg font-bold text-white">{stats.pendingInvoices}</p>
            </div>
          </div>
        </div>

              <div className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-400" size={20} />
                  <div>
                    <p className="text-red-400 text-sm font-medium">Overdue</p>
                    <p className="text-lg font-bold text-white">{stats.overdueInvoices}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Recent Invoices</h4>
              <div className="space-y-3">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice) => (
                    <div key={invoice._id} className="flex items-center justify-between p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors border border-gray-600">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-400' :
                          invoice.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        <div>
                          <p className="font-medium text-white">#{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-400">{invoice.client?.companyName}</p>
                      </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatCurrency(invoice.totalAmount)}</p>
                        <p className="text-sm text-gray-400 capitalize">{invoice.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400">No invoices yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <button
                onClick={() => handleNavigation('/invoices')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} />
                  <span>Create Invoice</span>
                </div>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleNavigation('/clients')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Users size={20} />
                  <span>Add Client</span>
                </div>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleNavigation('/projects')}
                className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Briefcase size={20} />
                  <span>New Project</span>
                </div>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleNavigation('/reports')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-xl font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={20} />
                  <span>View Reports</span>
                </div>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Monthly Summary */}
            <div className="mt-8 p-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl border border-gray-600">
              <h4 className="font-semibold text-white mb-3">This Month</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Revenue</span>
                  <span className="font-semibold text-white">{formatCurrency(stats.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Growth</span>
                  <span className={`font-semibold ${stats.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default DashboardPage; 