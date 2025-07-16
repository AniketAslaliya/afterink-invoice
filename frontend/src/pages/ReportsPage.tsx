import React, { useState, useEffect } from 'react'
import { DollarSign, FileText, Users, TrendingUp, BarChart3, Loader, RefreshCw, Calendar, Target, PieChart as PieChartIcon, Activity, Award, Clock, AlertTriangle } from 'lucide-react'
import { apiGet } from '../api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

interface ReportData {
  totalRevenue: number
  monthlyRevenue: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalClients: number
  activeProjects: number
  averageInvoiceValue: number
  collectionEfficiency: number
  monthlyStats: Array<{
    month: string
    revenue: number
    invoices: number
    paid: number
    pending: number
  }>
  clientStats: Array<{
    client: string
    revenue: number
    invoices: number
    avgValue: number
  }>
  statusBreakdown: Array<{
    status: string
    count: number
    percentage: number
    value: number
  }>
  pendingAmount: number
  totalBonuses: number;
  totalExpenses: number;
  netRevenue: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  status: string;
  totalAmount: number;
  dueDate: string;
  client?: {
    _id: string;
    companyName: string;
    contactPerson: {
      firstName: string;
      lastName: string;
      email: string;
    };
    name?: string;
  };
  project?: {
    _id: string;
    name: string;
  };
  currency?: string;
}

interface Client {
  _id: string;
  companyName: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    email: string;
  };
  name?: string;
}

interface Project {
  _id: string;
  name: string;
  status: string;
  clientId: string;
}

// Currency conversion utility (mock rates)
const currencyToINR = (amount: number, currency: string) => {
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

const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [activeTab, setActiveTab] = useState('overview')
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
    // Fetch bonuses and expenses for report metrics
    (async () => {
      try {
        const bonusRes = await apiGet('/bonuses');
        setBonuses(bonusRes.data || bonusRes);
        const expenseRes = await apiGet('/expenses');
        setExpenses(expenseRes.data || expenseRes);
      } catch {}
    })();
  }, [selectedPeriod, refreshKey]);

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch data from APIs with proper error handling
      const [invoicesResponse, clientsResponse, projectsResponse] = await Promise.all([
        apiGet('/invoices?limit=1000').catch(() => ({ data: { invoices: [] } })),
        apiGet('/clients').catch(() => ({ data: { clients: [] } })),
        apiGet('/projects').catch(() => ({ data: { projects: [] } }))
      ])

      // Handle different response structures
      let invoices: Invoice[] = []
      if (invoicesResponse && invoicesResponse.data && invoicesResponse.data.invoices) {
        invoices = invoicesResponse.data.invoices
      } else if (invoicesResponse && Array.isArray(invoicesResponse.invoices)) {
        invoices = invoicesResponse.invoices
      } else if (invoicesResponse && Array.isArray(invoicesResponse)) {
        invoices = invoicesResponse
      }

      let clients: Client[] = []
      if (clientsResponse && clientsResponse.data && clientsResponse.data.clients) {
        clients = clientsResponse.data.clients
      } else if (clientsResponse && Array.isArray(clientsResponse.clients)) {
        clients = clientsResponse.clients
      } else if (clientsResponse && Array.isArray(clientsResponse)) {
        clients = clientsResponse
      }

      console.log('Raw invoices response:', invoicesResponse)
      console.log('Raw clients response:', clientsResponse)
      console.log('Parsed invoices:', invoices)
      console.log('Parsed clients:', clients)

      let projects: Project[] = []
      if (projectsResponse && projectsResponse.data && projectsResponse.data.projects) {
        projects = projectsResponse.data.projects
      } else if (projectsResponse && Array.isArray(projectsResponse.projects)) {
        projects = projectsResponse.projects
      } else if (projectsResponse && Array.isArray(projectsResponse)) {
        projects = projectsResponse
      }

      console.log('Parsed data:', { invoices, clients, projects })

      // Calculate comprehensive report data
      const totalRevenue = invoices.reduce((sum: number, inv: Invoice) => 
        inv.status === 'paid' ? sum + currencyToINR(inv.totalAmount || 0, inv.currency || 'INR') : sum, 0)
      
      // Calculate pending amount
      const pendingAmount = invoices
        .filter((inv: Invoice) => inv.status === 'pending')
        .reduce((sum: number, inv: Invoice) => sum + currencyToINR(inv.totalAmount || 0, inv.currency || 'INR'), 0)

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = invoices
        .filter((inv: Invoice) => {
          const invDate = new Date(inv.dueDate)
          return invDate.getMonth() === currentMonth && 
                 invDate.getFullYear() === currentYear && 
                 inv.status === 'paid'
        })
        .reduce((sum: number, inv: Invoice) => sum + currencyToINR(inv.totalAmount || 0, inv.currency || 'INR'), 0)

      // Weekly revenue (last 7 days)
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      const weeklyRevenue = invoices
        .filter((inv: Invoice) => {
          const invDate = new Date(inv.dueDate)
          return invDate >= weekAgo && invDate <= now && inv.status === 'paid';
        })
        .reduce((sum: number, inv: Invoice) => sum + currencyToINR(inv.totalAmount || 0, inv.currency || 'INR'), 0);

      const paidInvoices = invoices.filter((inv: Invoice) => inv.status === 'paid').length
      const pendingInvoices = invoices.filter((inv: Invoice) => inv.status === 'pending').length
      const overdueInvoices = invoices.filter((inv: Invoice) => {
        const dueDate = new Date(inv.dueDate)
        return inv.status === 'pending' && dueDate < new Date()
      }).length

      const activeProjects = projects.filter((proj: Project) => proj.status === 'active').length
      
      // Advanced metrics
      const averageInvoiceValue = invoices.length > 0 ? 
        invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) / invoices.length : 0
      
      const collectionEfficiency = invoices.length > 0 ? 
        (paidInvoices / invoices.length) * 100 : 0

      // Generate monthly stats for the selected period
      const months = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12
      const monthlyStats = []
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        
        const monthRevenue = invoices
          .filter((inv: Invoice) => {
            const invDate = new Date(inv.dueDate)
            return invDate.getMonth() === date.getMonth() && 
                   invDate.getFullYear() === date.getFullYear() && 
                   inv.status === 'paid'
          })
          .reduce((sum: number, inv: Invoice) => sum + (inv.totalAmount || 0), 0)

        const monthInvoices = invoices
          .filter((inv: Invoice) => {
            const invDate = new Date(inv.dueDate)
            return invDate.getMonth() === date.getMonth() && 
                   invDate.getFullYear() === date.getFullYear()
          }).length

        const monthPaid = invoices
          .filter((inv: Invoice) => {
            const invDate = new Date(inv.dueDate)
            return invDate.getMonth() === date.getMonth() && 
                   invDate.getFullYear() === date.getFullYear() &&
                   inv.status === 'paid'
          }).length

        const monthPending = invoices
          .filter((inv: Invoice) => {
            const invDate = new Date(inv.dueDate)
            return invDate.getMonth() === date.getMonth() && 
                   invDate.getFullYear() === date.getFullYear() &&
                   inv.status === 'pending'
          }).length

        monthlyStats.push({
          month: monthName,
          revenue: monthRevenue,
          invoices: monthInvoices,
          paid: monthPaid,
          pending: monthPending
        })
      }

      // Generate enhanced client stats
      const clientRevenueMap = new Map()
      const clientInvoiceMap = new Map()
      
      console.log('Processing invoices for client stats:', invoices.length)
      console.log('Available clients:', clients.length)
      
      invoices.forEach((inv: Invoice) => {
        let clientName = 'Unknown Client'
        
        // First try to get client name from the populated client object
        if (inv.client?.companyName) {
          clientName = inv.client.companyName
        } else if (inv.client?.name) {
          // Fallback to name field if companyName doesn't exist
          clientName = inv.client.name
        } else {
          // Fallback to finding client by ID
          const client = clients.find(c => c._id === inv.clientId)
          if (client?.companyName) {
            clientName = client.companyName
          } else if (client?.name) {
            clientName = client.name
          } else {
            // If still no client name, use clientId as fallback
            clientName = `Client ${inv.clientId ? inv.clientId.slice(-6) : 'Unknown'}`
          }
        }
        
        console.log(`Invoice ${inv.invoiceNumber}: clientName = ${clientName}, status = ${inv.status}, amount = ${inv.totalAmount}`)
        
        // Track revenue for paid invoices
        if (inv.status === 'paid') {
          const currentRevenue = clientRevenueMap.get(clientName) || 0
          const invoiceRevenue = currencyToINR(inv.totalAmount || 0, inv.currency || 'INR')
          clientRevenueMap.set(clientName, currentRevenue + invoiceRevenue)
          console.log(`Added revenue for ${clientName}: ${invoiceRevenue} (total: ${currentRevenue + invoiceRevenue})`)
        }
        
        // Track total invoices for this client
        const currentInvoices = clientInvoiceMap.get(clientName) || 0
        clientInvoiceMap.set(clientName, currentInvoices + 1)
      })

      console.log('Client revenue map:', Object.fromEntries(clientRevenueMap))
      console.log('Client invoice map:', Object.fromEntries(clientInvoiceMap))

      const clientStats = Array.from(clientRevenueMap.entries())
        .map(([client, revenue]) => ({
          client,
          revenue: revenue as number,
          invoices: clientInvoiceMap.get(client) || 0,
          avgValue: (revenue as number) / (clientInvoiceMap.get(client) || 1)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10) // Show top 10 clients instead of 5

      console.log('Generated client stats:', clientStats)

      // Status breakdown for pie chart
      const statusCounts = {
        paid: paidInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices,
        draft: invoices.filter(inv => inv.status === 'draft').length
      }

      const totalInvoices = invoices.length
      const statusBreakdown = Object.entries(statusCounts)
        .map(([status, count]) => ({
          status,
          count,
          percentage: totalInvoices > 0 ? (count / totalInvoices) * 100 : 0,
          value: invoices
            .filter(inv => inv.status === status)
            .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
        }))
        .filter(item => item.count > 0)

      const totalBonuses = bonuses.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const netRevenue = totalRevenue + totalBonuses - totalExpenses;

      setReportData({
        totalRevenue: totalRevenue + totalBonuses, // <-- this is correct for total revenue
        monthlyRevenue,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalClients: clients.length,
        activeProjects,
        averageInvoiceValue,
        collectionEfficiency,
        monthlyStats,
        clientStats,
        statusBreakdown,
        pendingAmount,
        totalBonuses,
        totalExpenses,
        netRevenue, // <-- add netRevenue to reportData
      })

      setWeeklyRevenue(weeklyRevenue);

    } catch (err: any) {
      console.error('Error fetching report data:', err)
      setError(err.message || 'Failed to fetch report data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'paid': return 'text-green-400 bg-green-900/30'
  //     case 'pending': return 'text-yellow-400 bg-yellow-900/30'
  //     case 'overdue': return 'text-red-400 bg-red-900/30'
  //     case 'draft': return 'text-gray-400 bg-gray-900/30'
  //     default: return 'text-gray-400 bg-gray-900/30'
  //   }
  // }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-400 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Error loading reports</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
        <button 
          onClick={fetchReportData}
          className="btn btn-primary flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center text-gray-400 py-12">
        <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>No data available for reports</p>
      </div>
    )
  }

  // Show summary with total revenue and pending amount
  const summary = reportData && (
    <div className="flex flex-col md:flex-row gap-6 mb-8">
      <div className="bg-gradient-to-br from-green-800 to-green-600 rounded-2xl p-6 border border-green-700 flex-1">
        <div className="flex items-center gap-3">
          <DollarSign className="text-white" size={28} />
          <div>
            <div className="text-green-300 text-sm font-medium">Total Revenue</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(reportData.totalRevenue)}</div>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-yellow-800 to-yellow-600 rounded-2xl p-6 border border-yellow-700 flex-1">
        <div className="flex items-center gap-3">
          <Clock className="text-white" size={28} />
          <div>
            <div className="text-yellow-300 text-sm font-medium">Pending Amount</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(reportData.pendingAmount || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics & Reports</h1>
              <p className="text-gray-300">Comprehensive insights into your business performance</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
              </select>
              
              <button 
                onClick={fetchReportData}
                className="btn btn-outline flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-gray-800 rounded-xl p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue Analytics', icon: TrendingUp },
          { id: 'clients', label: 'Client Insights', icon: Users },
          { id: 'performance', label: 'Performance', icon: Activity }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-2xl p-6 border border-green-700/30 metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(reportData.totalRevenue)}</p>
                  <p className="text-green-300 text-xs mt-1">All-time earnings (includes bonuses, not expenses)</p>
                </div>
                <div className="bg-green-600 p-3 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-800 to-blue-600 rounded-2xl p-6 border border-blue-700 flex items-center gap-4 shadow-lg">
              <BarChart3 className="text-white bg-blue-500 rounded-full p-2" size={40} />
              <div>
                <div className="text-white text-lg font-bold">Total Bonuses</div>
                <div className="text-2xl text-blue-200 font-bold">{formatCurrency(reportData.totalBonuses)}</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-800 to-red-600 rounded-2xl p-6 border border-red-700 flex items-center gap-4 shadow-lg">
              <BarChart3 className="text-white bg-red-500 rounded-full p-2" size={40} />
              <div>
                <div className="text-white text-lg font-bold">Total Expenses</div>
                <div className="text-2xl text-red-200 font-bold">{formatCurrency(reportData.totalExpenses)}</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-2xl p-6 border border-blue-700/30 metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(reportData.monthlyRevenue)}</p>
                  <p className="text-blue-300 text-xs mt-1">This month</p>
                </div>
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-2xl p-6 border border-purple-700/30 metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium">Avg Invoice Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(reportData.averageInvoiceValue)}</p>
                  <p className="text-purple-300 text-xs mt-1">Per invoice</p>
                </div>
                <div className="bg-purple-600 p-3 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-2xl p-6 border border-orange-700/30 metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-400 text-sm font-medium">Collection Rate</p>
                  <p className="text-2xl font-bold text-white">{formatPercentage(reportData.collectionEfficiency)}</p>
                  <p className="text-orange-300 text-xs mt-1">Payment efficiency</p>
                </div>
                <div className="bg-orange-600 p-3 rounded-xl">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-800/90 to-emerald-700/90 backdrop-blur-lg rounded-2xl p-6 border border-emerald-700/50 card-hover stagger-item shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500">
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
                    <BarChart3 className="text-white" size={24} />
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-emerald-300 text-sm font-medium tracking-wide">Net Revenue</p>
                    <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{formatCurrency(reportData.netRevenue)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Distribution */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2" />
                Invoice Status Distribution
              </h3>
              <div className="space-y-4">
                {reportData.statusBreakdown.map((item, _: number) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'paid' ? 'bg-green-500' :
                        item.status === 'pending' ? 'bg-yellow-500' :
                        item.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-gray-300 capitalize">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{item.count} invoices</div>
                      <div className="text-gray-400 text-sm">{formatPercentage(item.percentage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Quick Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{reportData.totalInvoices}</div>
                  <div className="text-gray-400 text-sm">Total Invoices</div>
                </div>
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{reportData.totalClients}</div>
                  <div className="text-gray-400 text-sm">Active Clients</div>
                </div>
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{reportData.activeProjects}</div>
                  <div className="text-gray-400 text-sm">Active Projects</div>
                </div>
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <Clock className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{reportData.overdueInvoices}</div>
                  <div className="text-gray-400 text-sm">Overdue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Analytics Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-8">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-2xl p-6 border border-green-600">
              <p className="text-green-300 text-sm font-medium">Total Revenue (INR)</p>
              <p className="text-2xl font-bold text-white">₹{reportData.totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-6 border border-blue-600">
              <p className="text-blue-300 text-sm font-medium">Monthly Revenue (INR)</p>
              <p className="text-2xl font-bold text-white">₹{reportData.monthlyRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900 to-purple-700 rounded-2xl p-6 border border-purple-600">
              <p className="text-purple-300 text-sm font-medium">Weekly Revenue (INR)</p>
              <p className="text-2xl font-bold text-white">₹{weeklyRevenue.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Monthly Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.monthlyStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" tickFormatter={(v: number) => `₹${v/1000}k`} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                <Line type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Clients by Revenue */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Top Clients by Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.clientStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="client" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" tickFormatter={(v: number) => `₹${v/1000}k`} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                <Bar dataKey="revenue" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Invoice Status Breakdown */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Invoice Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChartIcon>
                <Pie
                  data={reportData.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#38bdf8"
                  label={({ status, percentage }: {status: string, percentage: number}) => `${status}: ${percentage.toFixed(1)}%`}
                >
                  {reportData.statusBreakdown.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={["#38bdf8", "#fbbf24", "#f87171", "#a3e635"][idx % 4]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} invoices`} />
                <Legend />
              </PieChartIcon>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Client Insights Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-8">
          {/* Top Clients */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Top Clients by Revenue
            </h3>
            
            {reportData.clientStats.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No Client Data Available</p>
                <p className="text-gray-500 text-sm">Client insights will appear here once you have invoices with paid status.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reportData.clientStats.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl hover:bg-gray-900/70 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {client.client.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{client.client}</div>
                        <div className="text-gray-400 text-sm">{client.invoices} invoice{client.invoices !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{formatCurrency(client.revenue)}</div>
                      <div className="text-gray-400 text-sm">Avg: {formatCurrency(client.avgValue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-2xl p-6 border border-blue-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium">Total Clients</p>
                  <p className="text-2xl font-bold text-white">{reportData.totalClients}</p>
                </div>
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-2xl p-6 border border-green-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">Active Clients</p>
                  <p className="text-2xl font-bold text-white">{reportData.clientStats.length}</p>
                </div>
                <div className="bg-green-600 p-3 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-2xl p-6 border border-purple-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium">Avg Revenue/Client</p>
                  <p className="text-2xl font-bold text-white">
                    {reportData.clientStats.length > 0 
                      ? formatCurrency(reportData.clientStats.reduce((sum, client) => sum + client.revenue, 0) / reportData.clientStats.length)
                      : formatCurrency(0)
                    }
                  </p>
                </div>
                <div className="bg-purple-600 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-2xl p-6 border border-green-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">Collection Rate</p>
                  <p className="text-2xl font-bold text-white">{formatPercentage(reportData.collectionEfficiency)}</p>
                  <p className="text-green-300 text-xs mt-1">Payment efficiency</p>
                </div>
                <div className="bg-green-600 p-3 rounded-xl">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-2xl p-6 border border-blue-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium">Avg Invoice Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(reportData.averageInvoiceValue)}</p>
                  <p className="text-blue-300 text-xs mt-1">Per invoice</p>
                </div>
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-2xl p-6 border border-purple-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium">Overdue Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {reportData.totalInvoices > 0 
                      ? formatPercentage((reportData.overdueInvoices / reportData.totalInvoices) * 100)
                      : '0%'
                    }
                  </p>
                  <p className="text-purple-300 text-xs mt-1">Late payments</p>
                </div>
                <div className="bg-purple-600 p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-2xl p-6 border border-orange-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-400 text-sm font-medium">Response Time</p>
                  <p className="text-2xl font-bold text-white">
                    {reportData.pendingInvoices > 0 ? '2.3 days' : 'N/A'}
                  </p>
                  <p className="text-orange-300 text-xs mt-1">Avg payment time</p>
                </div>
                <div className="bg-orange-600 p-3 rounded-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Performance Chart */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Payment Performance
              </h3>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">On-time Payments</span>
                    <span className="text-green-400 font-semibold">{formatPercentage(reportData.collectionEfficiency)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(reportData.collectionEfficiency, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Overdue Payments</span>
                    <span className="text-red-400 font-semibold">
                      {reportData.totalInvoices > 0 
                        ? formatPercentage((reportData.overdueInvoices / reportData.totalInvoices) * 100)
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((reportData.overdueInvoices / reportData.totalInvoices) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Efficiency Metrics */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Invoice Efficiency
              </h3>
              <div className="space-y-6">
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <div className="text-3xl font-bold text-white mb-2">{formatCurrency(reportData.averageInvoiceValue)}</div>
                  <div className="text-gray-400 text-sm">Average Invoice Value</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-lg font-bold text-blue-400">{reportData.totalInvoices}</div>
                    <div className="text-gray-400 text-xs">Total Invoices</div>
                  </div>
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-lg font-bold text-green-400">{reportData.paidInvoices}</div>
                    <div className="text-gray-400 text-xs">Paid Invoices</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Trends
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {reportData.monthlyRevenue > 0 ? '↗' : '→'}
                </div>
                <div className="text-white font-semibold">Monthly Growth</div>
                <div className="text-gray-400 text-sm">
                  {reportData.monthlyRevenue > 0 ? 'Positive' : 'Stable'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {reportData.collectionEfficiency > 80 ? '↗' : reportData.collectionEfficiency > 60 ? '→' : '↘'}
                </div>
                <div className="text-white font-semibold">Collection Trend</div>
                <div className="text-gray-400 text-sm">
                  {reportData.collectionEfficiency > 80 ? 'Excellent' : reportData.collectionEfficiency > 60 ? 'Good' : 'Needs Attention'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {reportData.clientStats.length > 0 ? '↗' : '→'}
                </div>
                <div className="text-white font-semibold">Client Growth</div>
                <div className="text-gray-400 text-sm">
                  {reportData.clientStats.length > 0 ? 'Active' : 'No Data'}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Performance Recommendations
            </h3>
            <div className="space-y-4">
              {reportData.collectionEfficiency < 70 && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium">Improve Collection Rate</p>
                    <p className="text-gray-400 text-sm">Consider implementing stricter payment terms or follow-up procedures.</p>
                  </div>
                </div>
              )}
              
              {reportData.overdueInvoices > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">Overdue Invoices Detected</p>
                    <p className="text-gray-400 text-sm">Follow up on {reportData.overdueInvoices} overdue invoice(s) to improve cash flow.</p>
                  </div>
                </div>
              )}
              
              {reportData.averageInvoiceValue < 10000 && (
                <div className="flex items-start space-x-3 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-300 font-medium">Increase Invoice Values</p>
                    <p className="text-gray-400 text-sm">Consider bundling services or reviewing pricing strategies.</p>
                  </div>
                </div>
              )}
              
              {reportData.collectionEfficiency >= 90 && reportData.overdueInvoices === 0 && (
                <div className="flex items-start space-x-3 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                  <Award className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-300 font-medium">Excellent Performance!</p>
                    <p className="text-gray-400 text-sm">Your collection rate and payment performance are outstanding.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage 