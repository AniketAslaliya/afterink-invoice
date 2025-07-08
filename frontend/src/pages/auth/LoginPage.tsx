import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { apiPost } from '../../api'


const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      console.log('Login attempt:', data)
      
      // Use the API utility function which has the correct production URL
      const response = await apiPost('/auth/login', {
          email: data.email,
          password: data.password,
      })
      
      console.log('Login response:', response)
      
      // Check if login was successful
      if (response && response.user && response.tokens) {
        const { user, tokens } = response
        
        // Store user and tokens in auth store
        login(user, tokens)
        
        // Store token in localStorage for API calls
        localStorage.setItem('token', tokens.accessToken)
        
        toast.success(`Welcome back, ${user.firstName}!`)
        navigate('/dashboard')
      } else {
        toast.error('Invalid email or password. Please try again.')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.message.includes('Invalid email or password') || error.message.includes('401')) {
        toast.error('Invalid email or password. Please check your credentials.')
      } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        toast.error('Unable to connect to server. Please try again later.')
      } else {
        toast.error('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary-950">Welcome back</h1>
        <p className="mt-2 text-sm text-secondary-700">
          Sign in to your account to continue
        </p>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-xl blur-xl"></div>
        <div className="relative p-6 bg-gradient-to-br from-primary-100/20 to-primary-200/20 backdrop-blur-sm border border-primary-300/30 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-primary-800">Admin Login</h3>
            <div className="w-6 h-6 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <LogIn className="h-3 w-3 text-primary-600" />
            </div>
          </div>
          <div className="text-sm text-primary-700 space-y-2">
            <div className="flex justify-between items-center">
              <span><strong>Email:</strong> admin@afterink.com</span>
            </div>
            <div className="flex justify-between items-center">
              <span><strong>Password:</strong> Password123</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'admin@afterink.com')
                setValue('password', 'Password123')
                toast.success('Admin credentials filled!')
              }}
              className="mt-3 w-full btn btn-outline !py-2 !px-4 !text-xs group"
            >
              <LogIn className="h-3 w-3 mr-2 group-hover:rotate-12 transition-transform" />
              Auto-fill credentials
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="main-content" role="main" aria-label="Login form">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-secondary-800">
            Email address
          </label>
          <div className="mt-1">
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="Enter your email"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-danger-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-secondary-800">
            Password
          </label>
          <div className="mt-1 relative">
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-secondary-400" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4 text-secondary-400" aria-hidden="true" />
              )}
            </button>
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-danger-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-800">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/auth/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full flex justify-center items-center space-x-2"
            aria-describedby={isLoading ? 'loading-status' : undefined}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                <span id="loading-status" className="sr-only">Signing in, please wait</span>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Sign in</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-secondary-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-secondary-200 text-secondary-700">Don't have an account?</span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/auth/register"
            className="btn btn-outline w-full text-center"
          >
            Create new account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 