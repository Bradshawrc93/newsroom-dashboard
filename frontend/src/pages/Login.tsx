import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoading, error, isAuthenticated } = useAuthStore()

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (error) {
      toast.error(`Slack authorization failed: ${error}`)
      return
    }
    
    if (code) {
      handleSlackCallback(code)
    }
  }, [searchParams])

  const handleSlackCallback = async (code: string) => {
    try {
      await login(code)
      toast.success('Successfully connected to Slack!')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Failed to connect to Slack. Please try again.')
    }
  }

  const handleSlackLogin = () => {
    // Redirect to Slack OAuth
    const clientId = import.meta.env.VITE_SLACK_CLIENT_ID
    const redirectUri = encodeURIComponent(window.location.origin + '/login')
    const scope = encodeURIComponent('channels:read,channels:history,users:read,users:read.email')
    
    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}`
    
    window.location.href = slackAuthUrl
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Newsroom Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to monitor your Slack activity
          </p>
        </div>
        
        <div className="card">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Connect with Slack
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                This app will access your Slack workspace to provide insights and summaries of your team's activity.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <button
              onClick={handleSlackLogin}
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4A154B] hover:bg-[#3a0f3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A154B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 15a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                  </svg>
                  Sign in with Slack
                </>
              )}
            </button>
            
            <div className="text-xs text-gray-500 text-center">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help?{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
