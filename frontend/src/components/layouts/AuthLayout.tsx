import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient">
            Afterink Studio
          </h1>
          <p className="mt-2 text-sm text-secondary-700">
            Professional Invoice & Client Management
          </p>
        </div>
        
        <div className="card">
          <div className="card-body space-y-6">
            {children}
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-secondary-600">
            © 2024 Afterink Studio. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout 