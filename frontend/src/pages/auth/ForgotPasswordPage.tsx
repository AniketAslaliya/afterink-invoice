import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const ForgotPasswordPage: React.FC = () => {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-secondary-900">Forgot Password</h2>
        <p className="mt-2 text-sm text-secondary-600">
          Reset your password to regain access
        </p>
      </div>

      <div className="p-6 text-center">
        <p className="text-secondary-600 mb-4">Password reset coming soon...</p>
        <Link
          to="/auth/login"
          className="btn btn-primary flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </Link>
      </div>
    </div>
  )
}

export default ForgotPasswordPage 