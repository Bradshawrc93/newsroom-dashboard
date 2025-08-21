import React from 'react'
import { 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  UsersIcon, 
  TagIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Newsroom Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor and summarize your Slack activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Messages</p>
              <p className="text-2xl font-semibold text-gray-900">1,234</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">45</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TagIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tags Created</p>
              <p className="text-2xl font-semibold text-gray-900">89</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">AI Tokens Used</p>
              <p className="text-2xl font-semibold text-gray-900">12.5K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Summary */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Daily Summary</h2>
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Yesterday's activity showed increased engagement in the product development channels. 
                Key discussions centered around the new feature rollout and user feedback collection. 
                The engineering team reported significant progress on the backend infrastructure updates.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  feature-rollout
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  user-feedback
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  engineering
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full btn-primary">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Generate Summary
            </button>
            <button className="w-full btn-secondary">
              <TagIcon className="h-4 w-4 mr-2" />
              Manage Tags
            </button>
            <button className="w-full btn-secondary">
              <UsersIcon className="h-4 w-4 mr-2" />
              View Users
            </button>
            <button className="w-full btn-secondary">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-sm text-gray-600">Updated the product roadmap with new Q1 objectives</p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-green-600">AS</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Alice Smith</p>
                <p className="text-sm text-gray-600">Shared user feedback from the beta testing phase</p>
                <p className="text-xs text-gray-400 mt-1">4 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-purple-600">MJ</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Mike Johnson</p>
                <p className="text-sm text-gray-600">Deployed the new authentication system to staging</p>
                <p className="text-xs text-gray-400 mt-1">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
