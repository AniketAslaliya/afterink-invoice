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

import React, { useEffect, useState } from 'react'
import { Users, FileText, FolderOpen, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { apiGet } from '../api'
import { useNavigate } from 'react-router-dom'

/**
 * Statistics interface for dashboard metrics
 * 
 * Defines the structure for the main dashboard statistics
 * that are displayed in the stat cards section.
 */
interface Stats {
  totalClients: number
  activeInvoices: number
  projects: number
  revenue: number
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  status: string;
  totalAmount: number;
  dueDate: string;
}

const DashboardPage: React.FC = () => {
  // Authentication state for user information
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  // Component state management
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Data Fetching Effect
   * 
   * Fetches dashboard statistics from multiple API endpoints on component mount.
   * Uses Promise.all for concurrent requests to improve performance.
   * Calculates revenue from invoice data and handles loading/error states.
   */
  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      apiGet('/clients').catch(() => []),
      apiGet('/invoices').catch(() => []),
      apiGet('/projects').catch(() => [])
    ])
      .then(([clientsRes, invoicesRes, projectsRes]) => {
        console.log('Dashboard API responses:', { clientsRes, invoicesRes, projectsRes })
        
        // Handle different response structures
        let clients = []
        if (clientsRes && clientsRes.data && clientsRes.data.clients) {
          clients = clientsRes.data.clients
        } else if (clientsRes && Array.isArray(clientsRes.clients)) {
          clients = clientsRes.clients
        } else if (clientsRes && Array.isArray(clientsRes)) {
          clients = clientsRes
        }

        let invoices: Invoice[] = []
        if (invoicesRes && invoicesRes.data && invoicesRes.data.invoices) {
          invoices = invoicesRes.data.invoices
        } else if (invoicesRes && Array.isArray(invoicesRes.invoices)) {
          invoices = invoicesRes.invoices
        } else if (invoicesRes && Array.isArray(invoicesRes)) {
          invoices = invoicesRes
        }

        let projects = []
        if (projectsRes && projectsRes.data && projectsRes.data.projects) {
          projects = projectsRes.data.projects
        } else if (projectsRes && Array.isArray(projectsRes.projects)) {
          projects = projectsRes.projects
        } else if (projectsRes && Array.isArray(projectsRes)) {
          projects = projectsRes
        }

        // Calculate statistics from API responses with correct field names
        setStats({
          totalClients: clients.length,
          activeInvoices: invoices.length,
          projects: projects.length,
          revenue: invoices.reduce((sum: number, inv: Invoice) => 
            sum + (inv.totalAmount || 0), 0)
        })
      })
      .catch(err => {
        console.error('Dashboard data fetch error:', err)
        if (err.message.includes('Access token') || err.message.includes('Failed to fetch') || err.message.includes('401')) {
          setError('🔒 Please log in to view dashboard')
        } else {
          setError(err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  /**
   * Navigation handlers for quick actions
   */
  const handleCreateInvoice = () => {
    navigate('/invoices')
    // Auto-trigger the "Add Invoice" button after navigation
    setTimeout(() => {
      const addButton = document.querySelector('[data-testid="add-invoice-btn"]') as HTMLButtonElement
      if (addButton) {
        addButton.click()
      }
    }, 100)
  }

  const handleAddClient = () => {
    navigate('/clients')
    // Auto-trigger the "Add Client" button after navigation
    setTimeout(() => {
      const addButton = document.querySelector('[data-testid="add-client-btn"]') as HTMLButtonElement
      if (addButton) {
        addButton.click()
      }
    }, 100)
  }

  const handleCreateProject = () => {
    navigate('/projects')
    // Auto-trigger the "Add Project" button after navigation
    setTimeout(() => {
      const addButton = document.querySelector('[data-testid="add-project-btn"]') as HTMLButtonElement
      if (addButton) {
        addButton.click()
      }
    }, 100)
  }

  /**
   * Statistics Cards Configuration
   * 
   * Defines the layout and styling for dashboard stat cards.
   * Each card includes an icon, color scheme, and dynamic value.
   * Uses conditional rendering to show loading state or actual data.
   */
  const statCards = [
    {
      name: 'Total Clients',
      value: stats ? stats.totalClients : '-',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'from-blue-500/20 to-blue-600/20',
      iconBg: 'bg-blue-500/20',
      onClick: () => navigate('/clients')
    },
    {
      name: 'Active Invoices',
      value: stats ? stats.activeInvoices : '-',
      icon: FileText,
      color: 'text-green-400',
      bgColor: 'from-green-500/20 to-green-600/20',
      iconBg: 'bg-green-500/20',
      onClick: () => navigate('/invoices')
    },
    {
      name: 'Projects',
      value: stats ? stats.projects : '-',
      icon: FolderOpen,
      color: 'text-purple-400',
      bgColor: 'from-purple-500/20 to-purple-600/20',
      iconBg: 'bg-purple-500/20',
      onClick: () => navigate('/projects')
    },
    {
      name: 'Revenue',
      value: stats ? `$${stats.revenue.toLocaleString()}` : '-',
      icon: DollarSign,
      color: 'text-amber-400',
      bgColor: 'from-amber-500/20 to-amber-600/20',
      iconBg: 'bg-amber-500/20',
      onClick: () => navigate('/reports')
    },
  ]

  /**
   * Recent Activities Mock Data
   * 
   * Placeholder data for the recent activity feed.
   * In a real application, this would be fetched from an API
   * and would include actual user activities and timestamps.
   */
  const recentActivities = [
    { id: 1, type: 'payment', message: 'Invoice #001 was paid', time: '2 hours ago', status: 'success' },
    { id: 2, type: 'client', message: 'New client added: ACME Corp', time: '4 hours ago', status: 'info' },
    { id: 3, type: 'project', message: 'Project "Website Redesign" started', time: '6 hours ago', status: 'primary' },
    { id: 4, type: 'invoice', message: 'Invoice #002 sent to client', time: '1 day ago', status: 'warning' },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2 text-blue-400">
          <Clock className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
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
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-600/30">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-lg text-gray-300">
            Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && !error.includes('🔒') && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.name} 
              className={`relative bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all duration-300 hover:scale-105 animate-float`} 
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={stat.onClick}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} rounded-2xl opacity-30`}></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.iconBg} backdrop-blur-sm`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-center space-x-1 text-green-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-100">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-100">Quick Actions</h3>
              <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Plus className="h-4 w-4 text-blue-400" />
              </div>
            </div>
            <div className="space-y-4">
              <button 
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group"
                onClick={handleCreateInvoice}
              >
                <FileText className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                <span>Create New Invoice</span>
              </button>
              <button 
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors group"
                onClick={handleAddClient}
              >
                <Users className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>Add New Client</span>
              </button>
              <button 
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors group"
                onClick={handleCreateProject}
              >
                <FolderOpen className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                <span>Start New Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-100">Recent Activity</h3>
              <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const statusColors = {
                  success: 'bg-green-500',
                  info: 'bg-blue-500',
                  primary: 'bg-purple-500',
                  warning: 'bg-amber-500'
                }
                
                const statusIcons = {
                  success: CheckCircle,
                  info: Users,
                  primary: FolderOpen,
                  warning: AlertCircle
                }
                
                const StatusIcon = statusIcons[activity.status as keyof typeof statusIcons]
                
                return (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-xl bg-gray-700/50 hover:bg-gray-700 transition-all duration-300 group">
                    <div className={`p-2 rounded-lg ${statusColors[activity.status as keyof typeof statusColors]}/20 group-hover:scale-110 transition-transform`}>
                      <StatusIcon className={`h-4 w-4 ${statusColors[activity.status as keyof typeof statusColors].replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100 group-hover:text-white">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 