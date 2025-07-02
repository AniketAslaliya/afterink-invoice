import React, { useState, useEffect } from 'react'
import { DollarSign, FileText, Users, TrendingUp, BarChart3, Loader, RefreshCw } from 'lucide-react'
import { apiGet } from '../api'

interface ReportData {
  totalRevenue: number
  monthlyRevenue: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalClients: number
  activeProjects: number
  monthlyStats: Array<{
    month: string
    revenue: number
    invoices: number
  }>
  clientStats: Array<{
    client: string
    revenue: number
    invoices: number
  }>
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
  };
  project?: {
    _id: string;
    name: string;
  };
}

interface Client {
  _id: string;
  companyName: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Project {
  _id: string;
  name: string;
  status: string;
  clientId: string;
}

const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('6months')

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch data from APIs with proper error handling
      const [invoicesResponse, clientsResponse, projectsResponse] = await Promise.all([
        apiGet('/invoices').catch(() => ({ data: { invoices: [] } })),
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

      let projects: Project[] = []
      if (projectsResponse && projectsResponse.data && projectsResponse.data.projects) {
        projects = projectsResponse.data.projects
      } else if (projectsResponse && Array.isArray(projectsResponse.projects)) {
        projects = projectsResponse.projects
      } else if (projectsResponse && Array.isArray(projectsResponse)) {
        projects = projectsResponse
      }

      console.log('Parsed data:', { invoices, clients, projects })

      // Calculate report data with proper field names
      const totalRevenue = invoices.reduce((sum: number, inv: Invoice) => 
        inv.status === 'paid' ? sum + (inv.totalAmount || 0) : sum, 0)
      
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = invoices
        .filter((inv: Invoice) => {
          const invDate = new Date(inv.dueDate)
          return invDate.getMonth() === currentMonth && 
                 invDate.getFullYear() === currentYear && 
                 inv.status === 'paid'
        })
        .reduce((sum: number, inv: Invoice) => sum + (inv.totalAmount || 0), 0)

      const paidInvoices = invoices.filter((inv: Invoice) => inv.status === 'paid').length
      const pendingInvoices = invoices.filter((inv: Invoice) => inv.status === 'pending').length
      const overdueInvoices = invoices.filter((inv: Invoice) => {
        const dueDate = new Date(inv.dueDate)
        return inv.status === 'pending' && dueDate < new Date()
      }).length

      const activeProjects = projects.filter((proj: Project) => proj.status === 'active').length

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

        monthlyStats.push({
          month: monthName,
          revenue: monthRevenue,
          invoices: monthInvoices
        })
      }

      // Generate client stats with proper client name handling
      const clientRevenueMap = new Map()
      const clientInvoiceMap = new Map()
      
      invoices.forEach((inv: Invoice) => {
        // Try multiple ways to get client name
        let clientName = 'Unknown Client'
        
        if (inv.client?.companyName) {
          clientName = inv.client.companyName
        } else {
          // Find client by ID if not populated
          const client = clients.find(c => c._id === inv.clientId)
          if (client?.companyName) {
            clientName = client.companyName
          }
        }
        
        if (inv.status === 'paid') {
          clientRevenueMap.set(clientName, (clientRevenueMap.get(clientName) || 0) + (inv.totalAmount || 0))
        }
        clientInvoiceMap.set(clientName, (clientInvoiceMap.get(clientName) || 0) + 1)
      })

      const clientStats = Array.from(clientRevenueMap.entries())
        .map(([client, revenue]) => ({
          client,
          revenue: revenue as number,
          invoices: clientInvoiceMap.get(client) || 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      setReportData({
        totalRevenue,
        monthlyRevenue,
        totalInvoices: invoices.length,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalClients: clients.length,
        activeProjects,
        monthlyStats,
        clientStats
      })
    } catch (error: any) {
      console.error('Error fetching report data:', error)
      if (error.message.includes('Access token') || error.message.includes('Failed to fetch') || error.message.includes('401')) {
        setError('🔒 Please log in to view reports')
      } else {
        setError(error.message || 'Failed to load report data')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2 text-blue-400">
          <Loader className="h-6 w-6 animate-spin" />
          <span>Loading reports...</span>
        </div>
      </div>
    )
  }

  if (error && error.includes('🔒')) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <div className="text-yellow-400 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Reports</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchReportData}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">No Report Data</h2>
          <p className="text-gray-400 mb-6">Unable to generate reports</p>
          <button 
            onClick={fetchReportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Reports & Analytics</h1>
          <p className="text-gray-400">Track your business performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button
            onClick={fetchReportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-100">
                {formatCurrency(reportData.totalRevenue)}
              </p>
              <p className="text-xs text-green-400 mt-1">All time</p>
            </div>
            <div className="h-12 w-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-100">
                {formatCurrency(reportData.monthlyRevenue)}
              </p>
              <p className="text-xs text-blue-400 mt-1">This month</p>
            </div>
            <div className="h-12 w-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-100">{reportData.totalInvoices}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-green-400">{reportData.paidInvoices} paid</span>
                <span className="text-xs text-yellow-400">{reportData.pendingInvoices} pending</span>
                <span className="text-xs text-red-400">{reportData.overdueInvoices} overdue</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Clients</p>
              <p className="text-2xl font-bold text-gray-100">{reportData.totalClients}</p>
              <p className="text-xs text-orange-400 mt-1">{reportData.activeProjects} active projects</p>
            </div>
            <div className="h-12 w-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">Monthly Revenue</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {reportData.monthlyStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{stat.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${reportData.monthlyStats.length > 0 ? 
                          (stat.revenue / Math.max(...reportData.monthlyStats.map(s => s.revenue)) * 100) : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-100 w-20 text-right">
                    {formatCurrency(stat.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">Top Clients</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {reportData.clientStats.length > 0 ? reportData.clientStats.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-100">{client.client}</p>
                  <p className="text-xs text-gray-400">{client.invoices} invoices</p>
                </div>
                <span className="text-sm font-bold text-green-400">
                  {formatCurrency(client.revenue)}
                </span>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No client data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage 