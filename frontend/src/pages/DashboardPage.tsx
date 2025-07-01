import React from 'react'
import { Users, FileText, FolderOpen, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()

  const stats = [
    { 
      name: 'Total Clients', 
      value: '12', 
      change: '+2.5%',
      trend: 'up',
      icon: Users, 
      color: 'text-blue-500',
      bgColor: 'from-blue-500/20 to-blue-600/20',
      iconBg: 'bg-blue-500/20'
    },
    { 
      name: 'Active Invoices', 
      value: '8', 
      change: '+12.3%',
      trend: 'up',
      icon: FileText, 
      color: 'text-green-500',
      bgColor: 'from-green-500/20 to-green-600/20',
      iconBg: 'bg-green-500/20'
    },
    { 
      name: 'Projects', 
      value: '5', 
      change: '+8.1%',
      trend: 'up',
      icon: FolderOpen, 
      color: 'text-purple-500',
      bgColor: 'from-purple-500/20 to-purple-600/20',
      iconBg: 'bg-purple-500/20'
    },
    { 
      name: 'Revenue', 
      value: '$15,420', 
      change: '+18.7%',
      trend: 'up',
      icon: DollarSign, 
      color: 'text-amber-500',
      bgColor: 'from-amber-500/20 to-amber-600/20',
      iconBg: 'bg-amber-500/20'
    },
  ]

  const recentActivities = [
    { id: 1, type: 'payment', message: 'Invoice #001 was paid', time: '2 hours ago', status: 'success' },
    { id: 2, type: 'client', message: 'New client added: ACME Corp', time: '4 hours ago', status: 'info' },
    { id: 3, type: 'project', message: 'Project "Website Redesign" started', time: '6 hours ago', status: 'primary' },
    { id: 4, type: 'invoice', message: 'Invoice #002 sent to client', time: '1 day ago', status: 'warning' },
  ]

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-secondary-200/60 to-secondary-300/60 backdrop-blur-lg rounded-2xl p-8 border border-secondary-300/30">
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-lg text-secondary-700">
            Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className={`stat-card animate-float`} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} rounded-2xl opacity-50`}></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.iconBg} backdrop-blur-sm`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-center space-x-1 text-green-500">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">{stat.change}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-700 mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold text-secondary-950">{stat.value}</p>
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
          <div className="gradient-border">
            <div className="gradient-border-content">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-secondary-950">Quick Actions</h3>
                <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary-600" />
                </div>
              </div>
              <div className="space-y-4">
                <button className="btn btn-primary w-full group">
                  <FileText className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Create New Invoice
                </button>
                <button className="btn btn-outline w-full group">
                  <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Add New Client
                </button>
                <button className="btn btn-outline w-full group">
                  <FolderOpen className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Start New Project
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-secondary-950">Recent Activity</h3>
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
            <div className="card-body">
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
                    <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-xl bg-secondary-300/30 hover:bg-secondary-300/50 transition-all duration-300 group">
                      <div className={`p-2 rounded-lg ${statusColors[activity.status as keyof typeof statusColors]}/20 group-hover:scale-110 transition-transform`}>
                        <StatusIcon className={`h-4 w-4 ${statusColors[activity.status as keyof typeof statusColors].replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 group-hover:text-secondary-950">
                          {activity.message}
                        </p>
                        <p className="text-xs text-secondary-600 mt-1">{activity.time}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrendingUp className="h-4 w-4 text-secondary-500" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 