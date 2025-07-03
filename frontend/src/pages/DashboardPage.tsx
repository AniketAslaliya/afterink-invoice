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
import { useAppSelector, useAppDispatch } from '../store';
import { fetchDashboardStats } from '../store/dashboardSlice';
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
  
  const stats = useAppSelector((state: any) => state.dashboard.stats);
  const loading = useAppSelector((state: any) => state.dashboard.loading);
  const error = useAppSelector((state: any) => state.dashboard.error);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, []);

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
                <p className="text-2xl font-bold text-white">{formatCurrency(stats ? stats.totalRevenue : 0)}</p>
              </div>
                  </div>
            <div className="flex items-center gap-2">
              {stats ? (stats.monthlyGrowth >= 0 ? (
                <TrendingUp className="text-green-400" size={16} />
              ) : (
                <TrendingDown className="text-red-400" size={16} />
              )) : null}
              <span className={`text-sm font-medium ${stats ? (stats.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400') : ''}`}>
                {Math.abs(typeof stats?.monthlyGrowth === 'number' ? stats.monthlyGrowth : 0).toFixed(1)}% from last month
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
                <p className="text-2xl font-bold text-white">{stats ? stats.totalInvoices : 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-400" size={16} />
              <span className="text-sm text-gray-300">
                {stats ? (stats.paidInvoices + ', ' + stats.pendingInvoices) : ''}
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
                <p className="text-2xl font-bold text-white">{stats ? stats.totalClients : 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="text-purple-400" size={16} />
              <span className="text-sm text-gray-300">
                {stats ? (stats.totalProjects + ' total projects') : ''}
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
                <p className="text-2xl font-bold text-white">{typeof stats?.paymentRate === 'number' ? stats.paymentRate.toFixed(1) : '0.0'}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="text-orange-400" size={16} />
              <span className="text-sm text-gray-300">
                Avg: {typeof stats?.averageInvoiceValue === 'number' ? stats.averageInvoiceValue.toFixed(1) : '0.0'}
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
                    <p className="text-lg font-bold text-white">{stats ? stats.paidInvoices : 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                <div className="flex items-center gap-3">
                  <Clock className="text-yellow-400" size={20} />
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Pending</p>
                    <p className="text-lg font-bold text-white">{stats ? stats.pendingInvoices : 0}</p>
            </div>
          </div>
        </div>

              <div className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-400" size={20} />
                  <div>
                    <p className="text-red-400 text-sm font-medium">Overdue</p>
                    <p className="text-lg font-bold text-white">{stats ? stats.overdueInvoices : 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Recent Invoices</h4>
              <div className="space-y-3">
                {stats ? (stats.totalInvoices > 0 ? (
                  <div className="flex items-center justify-between p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors border border-gray-600">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        stats.paidInvoices > 0 ? 'bg-green-400' :
                        stats.pendingInvoices > 0 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <div>
                        <p className="font-medium text-white">#{stats.totalInvoices - stats.overdueInvoices - stats.pendingInvoices - stats.paidInvoices + 1}</p>
                        <p className="text-sm text-gray-400">{stats.totalClients} clients</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatCurrency(stats.totalRevenue)}</p>
                      <p className="text-sm text-gray-400 capitalize">{stats.paidInvoices > 0 ? 'paid' : stats.pendingInvoices > 0 ? 'pending' : 'overdue'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400">No invoices yet</p>
                  </div>
                )) : null}
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
                  <span className="font-semibold text-white">{formatCurrency(stats ? stats.monthlyRevenue : 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Growth</span>
                  <span className={`font-semibold ${stats ? (stats.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400') : ''}`}>
                    {stats ? (stats.monthlyGrowth >= 0 ? '+' : '') + (typeof stats?.monthlyGrowth === 'number' ? stats.monthlyGrowth.toFixed(1) : '0.0') : ''}%
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