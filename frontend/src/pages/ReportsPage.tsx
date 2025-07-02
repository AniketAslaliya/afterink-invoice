import React, { useState, useEffect } from 'react'
import { DollarSign, FileText, Users, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
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

const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('6months')

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      // Since we don't have a reports endpoint, we'll fetch individual data and calculate
      const [invoices, clients, projects] = await Promise.all([
        apiGet('/invoices'),
        apiGet('/clients'),
        apiGet('/projects')
      ])

      // Calculate report data
      const totalRevenue = invoices.reduce((sum: number, inv: any) => 
        inv.status === 'paid' ? sum + inv.total : sum, 0)
      
      const currentMonth = new Date().getMonth()
      const monthlyRevenue = invoices
        .filter((inv: any) => {
          const invDate = new Date(inv.dueDate)
          return invDate.getMonth() === currentMonth && inv.status === 'paid'
        })
        .reduce((sum: number, inv: any) => sum + inv.total, 0)

      const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid').length
      const pendingInvoices = invoices.filter((inv: any) => inv.status === 'pending').length
      const overdueInvoices = invoices.filter((inv: any) => {
        const dueDate = new Date(inv.dueDate)
        return inv.status === 'pending' && dueDate < new Date()
      }).length

      const activeProjects = projects.filter((proj: any) => proj.status === 'active').length

      // Generate monthly stats for the last 6 months
      const monthlyStats = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        
        const monthRevenue = invoices
          .filter((inv: any) => {
            const invDate = new Date(inv.dueDate)
            return invDate.getMonth() === date.getMonth() && 
                   invDate.getFullYear() === date.getFullYear() && 
                   inv.status === 'paid'
          })
          .reduce((sum: number, inv: any) => sum + inv.total, 0)

        const monthInvoices = invoices
          .filter((inv: any) => {
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

      // Generate client stats
      const clientRevenueMap = new Map()
      const clientInvoiceMap = new Map()
      
      invoices.forEach((inv: any) => {
        const clientName = inv.client?.name || 'Unknown Client'
        if (inv.status === 'paid') {
          clientRevenueMap.set(clientName, (clientRevenueMap.get(clientName) || 0) + inv.total)
        }
        clientInvoiceMap.set(clientName, (clientInvoiceMap.get(clientName) || 0) + 1)
      })

      const clientStats = Array.from(clientRevenueMap.entries())
        .map(([client, revenue]) => ({
          client,
          revenue,
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
    } catch (error) {
      console.error('Error fetching report data:', error)
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <p className="text-secondary-800 mb-4">Unable to load report data</p>
          <button 
            onClick={fetchReportData}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-950">Reports & Analytics</h1>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Revenue</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {formatCurrency(reportData.totalRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">This Month</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {formatCurrency(reportData.monthlyRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Invoices</p>
                <p className="text-2xl font-bold text-secondary-900">{reportData.totalInvoices}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Active Clients</p>
                <p className="text-2xl font-bold text-secondary-900">{reportData.totalClients}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Invoice Status Breakdown */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Invoice Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-secondary-700">Paid</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{reportData.paidInvoices}</span>
                  <span className="text-sm text-secondary-500 ml-2">
                    ({reportData.totalInvoices > 0 ? Math.round((reportData.paidInvoices / reportData.totalInvoices) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-secondary-700">Pending</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{reportData.pendingInvoices}</span>
                  <span className="text-sm text-secondary-500 ml-2">
                    ({reportData.totalInvoices > 0 ? Math.round((reportData.pendingInvoices / reportData.totalInvoices) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-secondary-700">Overdue</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{reportData.overdueInvoices}</span>
                  <span className="text-sm text-secondary-500 ml-2">
                    ({reportData.totalInvoices > 0 ? Math.round((reportData.overdueInvoices / reportData.totalInvoices) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Monthly Revenue
            </h3>
            <div className="space-y-3">
              {reportData.monthlyStats.map((stat, index) => {
                const maxRevenue = Math.max(...reportData.monthlyStats.map(s => s.revenue))
                const width = maxRevenue > 0 ? (stat.revenue / maxRevenue) * 100 : 0
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="w-12 text-sm text-secondary-600">{stat.month}</div>
                    <div className="flex-1 mx-3">
                      <div className="bg-secondary-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-secondary-900 w-16 text-right">
                      {formatCurrency(stat.revenue)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="card">
        <div className="card-body">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Top Clients by Revenue
          </h3>
          {reportData.clientStats.length === 0 ? (
            <p className="text-secondary-600 text-center py-4">No client data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-2 font-medium text-secondary-900">Client</th>
                    <th className="text-left py-2 font-medium text-secondary-900">Revenue</th>
                    <th className="text-left py-2 font-medium text-secondary-900">Invoices</th>
                    <th className="text-left py-2 font-medium text-secondary-900">Avg. Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.clientStats.map((client, index) => (
                    <tr key={index} className="border-b border-secondary-100">
                      <td className="py-3 font-medium text-secondary-900">{client.client}</td>
                      <td className="py-3 text-secondary-700">{formatCurrency(client.revenue)}</td>
                      <td className="py-3 text-secondary-700">{client.invoices}</td>
                      <td className="py-3 text-secondary-700">
                        {formatCurrency(client.revenue / client.invoices)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsPage 