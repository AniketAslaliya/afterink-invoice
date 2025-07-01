import React from 'react'
import { Link } from 'react-router-dom'

const RegisterPage: React.FC = () => {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-secondary-900">Create Account</h2>
        <p className="mt-2 text-sm text-secondary-600">
          Join Afterink Studio to manage your business
        </p>
      </div>

      <div className="p-6 text-center">
        <p className="text-secondary-600 mb-4">Registration coming soon...</p>
        <Link
          to="/auth/login"
          className="btn btn-primary"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}

export default RegisterPage 