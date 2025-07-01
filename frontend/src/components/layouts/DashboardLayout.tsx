import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-secondary-100 via-secondary-200 to-secondary-300">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-secondary-600 bg-opacity-75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-secondary-200/80 backdrop-blur-lg">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent currentPath={location.pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-secondary-200 shadow border-b border-secondary-300">
          <button
            className="px-4 border-r border-secondary-300 text-secondary-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-2xl font-semibold text-secondary-950">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-secondary-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-secondary-600 capitalize">{user?.role}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-secondary-600 hover:text-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-2"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

const SidebarContent: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  return (
    <div className="flex flex-col h-0 flex-1">
      <div className="relative flex items-center h-16 flex-shrink-0 px-6 bg-gradient-to-r from-primary-200/60 to-primary-300/60 backdrop-blur-lg border-b border-secondary-300/50">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 rounded-t-xl"></div>
        <h1 className="relative text-xl font-bold text-gradient">Afterink Studio</h1>
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto bg-secondary-200/70 backdrop-blur-sm">
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = currentPath === item.href
            const Icon = item.icon
            
            return (
                            <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-950 border-r-4 border-primary-500 shadow-lg'
                    : 'text-secondary-700 hover:bg-secondary-300/50 hover:text-secondary-950'
                } group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 hover:shadow-md hover:transform hover:translate-x-1`}
              >
                <Icon
                  className={`${
                    isActive ? 'text-primary-600' : 'text-secondary-600 group-hover:text-secondary-700 group-hover:scale-110'
                  } mr-3 h-5 w-5 transition-all duration-300`}
                />
                <span className="relative">
                  {item.name}
                  {isActive && (
                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"></div>
                  )}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default DashboardLayout 