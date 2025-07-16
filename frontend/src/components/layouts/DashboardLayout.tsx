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
  User,
  Palette,
  Gift,
  Receipt,
  List
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../contexts/ThemeContext'
import Avatar from '../Avatar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Bonuses', href: '/bonuses', icon: Gift },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Expense Reasons', href: '/expense-reasons', icon: List },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
]

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, setThemeMode } = useTheme()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full sidebar-modern">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <SidebarContent currentPath={location.pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 sidebar-modern">
          <SidebarContent currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <header className="dashboard-header relative z-10 flex-shrink-0 flex h-16" role="banner">
          <button
            className="px-4 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden rounded-lg mx-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-2xl font-semibold text-white">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setThemeMode(theme.mode === 'dark' ? 'light' : 'dark')}
                className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 transition-colors"
                aria-label={`Switch to ${theme.mode === 'dark' ? 'light' : 'dark'} mode`}
              >
                <Palette className="h-5 w-5" aria-hidden="true" />
              </button>
              
              <div className="flex items-center space-x-2" role="img" aria-label={`User: ${user?.firstName} ${user?.lastName}, Role: ${user?.role}`}>
                <Avatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="sm"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-200">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none page-container" id="main-content" role="main">
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
      <div className="relative flex items-center h-16 flex-shrink-0 px-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Afterink Studio
        </h2>
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-3 py-6 space-y-2" role="navigation" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = currentPath === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`menu-item-modern group flex items-center px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  isActive ? 'active text-blue-400' : 'text-gray-300 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`mr-3 h-5 w-5 transition-all duration-300 ${
                    isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400 group-hover:scale-110'
                  }`}
                  aria-hidden="true"
                />
                <span className="relative">
                  {item.name}
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