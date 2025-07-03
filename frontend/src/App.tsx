/**
 * Afterink Invoice Management Application
 * 
 * Main application component that handles routing, authentication,
 * and layout management for the invoice management system.
 * 
 * Features:
 * - Route-based authentication protection
 * - Automatic redirects based on auth state
 * - Nested routing for auth and dashboard sections
 * - Layout-based component organization
 * 
 * @author Afterink Team
 * @version 1.0.0
 */

// Force Vercel to pick up latest changes - Build: 2024-12-19
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

// Layout components - provide consistent structure and navigation
import AuthLayout from '@components/layouts/AuthLayout'
import DashboardLayout from '@components/layouts/DashboardLayout'

// Authentication pages
import LoginPage from '@pages/auth/LoginPage'
import RegisterPage from '@pages/auth/RegisterPage'
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage'

// Main application pages
import DashboardPage from '@pages/DashboardPage'
import ClientsPage from '@pages/ClientsPage'
import InvoicesPage from '@pages/InvoicesPage'
import ProjectsPage from '@pages/ProjectsPage'
import ReportsPage from '@pages/ReportsPage'
import SettingsPage from '@pages/SettingsPage'
import ProfilePage from '@pages/ProfilePage'
import NotFoundPage from '@pages/NotFoundPage'

/**
 * Route Protection Components
 * 
 * These components handle authentication-based route protection
 * and automatic redirects to maintain proper user flow.
 */

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute Component
 * 
 * Ensures that only authenticated users can access protected routes.
 * Redirects unauthenticated users to the login page.
 * 
 * @param children - The components to render if user is authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }
  
  return <>{children}</>
}

/**
 * PublicRoute Component
 * 
 * Handles public routes (login, register, etc.) and redirects
 * authenticated users to the dashboard to prevent unnecessary
 * access to auth pages when already logged in.
 * 
 * @param children - The components to render if user is not authenticated
 */
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

/**
 * Main App Component
 * 
 * The root component of the application that sets up the routing structure.
 * Organizes routes into two main sections:
 * 1. Authentication routes (/auth/*) - for login, register, forgot password
 * 2. Dashboard routes (/*) - for main application functionality
 * 
 * Each section uses its own layout component and route protection.
 */
function App() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Routes>
        {/* 
          Authentication Routes Section
          
          Handles all authentication-related pages using PublicRoute protection.
          Uses AuthLayout for consistent styling and structure.
          Automatically redirects authenticated users away from these pages.
        */}
        <Route
          path="/auth/*"
          element={
            <PublicRoute>
              <AuthLayout>
                <Routes>
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  {/* Default auth route redirects to login */}
                  <Route path="*" element={<Navigate to="login" replace />} />
                </Routes>
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* 
          Main Application Routes Section
          
          Contains all protected application pages using ProtectedRoute.
          Uses DashboardLayout for navigation and consistent structure.
          Requires authentication to access any of these routes.
        */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  {/* Core application pages */}
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  
                  {/* Default route redirects to dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* 404 handler for unmatched routes */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App 