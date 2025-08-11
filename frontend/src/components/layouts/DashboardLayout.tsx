import React, { useState, useEffect } from 'react'
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
  List,
  Bell,
  Search,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../contexts/ThemeContext'
import Avatar from '../Avatar'
import { useToast } from '../Toast'
import Button from '../Button'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, badge: null },
  { name: 'Clients', href: '/clients', icon: Users, badge: null },
  { name: 'Invoices', href: '/invoices', icon: FileText, badge: null },
  { name: 'Projects', href: '/projects', icon: FolderOpen, badge: null },
  { name: 'Bonuses', href: '/bonuses', icon: Gift, badge: null },
  { name: 'Expenses', href: '/expenses', icon: Receipt, badge: null },
  { name: 'Expense Reasons', href: '/expense-reasons', icon: List, badge: null },
  { name: 'Reports', href: '/reports', icon: BarChart3, badge: null },
  { name: 'Settings', href: '/settings', icon: Settings, badge: null },
  { name: 'Profile', href: '/profile', icon: User, badge: null },
]

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, setThemeMode } = useTheme()
  const { addToast } = useToast()

  const handleLogout = () => {
    logout()
    addToast({
      type: 'success',
      title: 'Logged out successfully',
      message: 'You have been logged out of your account.'
    })
  }

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-menu') && !target.closest('.notifications-menu')) {
        setUserMenuOpen(false)
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentPage = navigation.find(item => item.href === location.pathname)

  return (
    <div className={`h-screen flex overflow-hidden ${theme.mode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className={`relative flex-1 flex flex-col max-w-xs w-full ${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl transform transition-transform duration-300 ease-in-out`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className={`ml-1 flex items-center justify-center h-10 w-10 rounded-full ${theme.mode === 'dark' ? 'bg-gray-700' : 'bg-white'} shadow-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`}
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className={`h-6 w-6 ${theme.mode === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} aria-hidden="true" />
              </button>
            </div>
            <SidebarContent currentPath={location.pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className={`flex flex-col w-64 ${theme.mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg border-r`}>
          <SidebarContent currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <header className={`relative z-10 flex-shrink-0 flex h-16 ${theme.mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`} role="banner">
          <button
            className={`px-4 ${theme.mode === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden rounded-lg mx-2 transition-colors`}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <h1 className={`text-2xl font-bold ${theme.mode === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center`}>
                {currentPage?.icon && <currentPage.icon className="h-6 w-6 mr-3 text-blue-600" />}
                {currentPage?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <button
                className={`p-2 ${theme.mode === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-400 hover:text-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors`}
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Theme toggle */}
              <button
                className={`p-2 ${theme.mode === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-400 hover:text-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors`}
                onClick={() => setThemeMode(theme.mode === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme.mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications */}
              <div className="relative notifications-menu">
                <button
                  className={`p-2 ${theme.mode === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-400 hover:text-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors relative`}
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                {notificationsOpen && (
                  <div className={`absolute right-0 mt-2 w-80 ${theme.mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border py-2 z-50`}>
                    <div className={`px-4 py-2 border-b ${theme.mode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <h3 className={`text-sm font-semibold ${theme.mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className={`px-4 py-3 ${theme.mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer`}>
                        <p className={`text-sm ${theme.mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>New invoice created</p>
                        <p className={`text-xs ${theme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>2 minutes ago</p>
                      </div>
                      <div className={`px-4 py-3 ${theme.mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer`}>
                        <p className={`text-sm ${theme.mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Payment received</p>
                        <p className={`text-xs ${theme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>1 hour ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative user-menu">
                <button
                  className={`flex items-center space-x-3 p-2 rounded-lg ${theme.mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  <Avatar user={user} size="sm" />
                  <div className="hidden md:block text-left">
                    <p className={`text-sm font-medium ${theme.mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'User'}</p>
                    <p className={`text-xs ${theme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email || 'user@example.com'}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 ${theme.mode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                </button>

                {userMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 ${theme.mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border py-2 z-50`}>
                    <Link
                      to="/profile"
                      className={`block px-4 py-2 text-sm ${theme.mode === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className={`block px-4 py-2 text-sm ${theme.mode === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <hr className={`my-2 ${theme.mode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />
                    <button
                      onClick={handleLogout}
                      className={`block w-full text-left px-4 py-2 text-sm text-red-600 ${theme.mode === 'dark' ? 'hover:bg-red-900/20' : 'hover:bg-red-50'} transition-colors`}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className={`py-6 ${theme.mode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

const SidebarContent: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const { user } = useAuthStore()
  const { theme } = useTheme()

  return (
    <>
      {/* Logo */}
      <div className={`flex items-center justify-center h-16 px-4 border-b ${theme.mode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className={`text-xl font-bold ${theme.mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Afterink</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600' 
                  : theme.mode === 'dark' 
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <item.icon 
                className={`
                  mr-3 h-5 w-5 flex-shrink-0 transition-colors
                  ${isActive ? 'text-blue-600' : theme.mode === 'dark' ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-500'}
                `} 
              />
              {item.name}
              {item.badge && (
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className={`flex-shrink-0 p-4 border-t ${theme.mode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <Avatar user={user} size="sm" />
          <div className="ml-3 flex-1 min-w-0">
            <p className={`text-sm font-medium ${theme.mode === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
              {user?.name || 'User'}
            </p>
            <p className={`text-xs ${theme.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default DashboardLayout 