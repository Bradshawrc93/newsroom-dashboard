import React from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

const Login: React.FC = () => {
  const handleSlackLogin = () => {
    // TODO: Implement Slack OAuth
    console.log('Slack login clicked')
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
            
            <button
              onClick={handleSlackLogin}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4A154B] hover:bg-[#3a0f3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A154B] transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 15a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
              </svg>
              Sign in with Slack
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
