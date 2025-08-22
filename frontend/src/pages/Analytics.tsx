import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentChartBarIcon,
  CpuChipIcon,
  ServerIcon
} from '@heroicons/react/24/outline'
import { analyticsApi, messagesApi, channelsApi, usersApi, tagsApi } from '@/services/api'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface AnalyticsData {
  totalMessages: number
  totalUsers: number
  totalChannels: number
  totalTags: number
  messagesToday: number
  messagesThisWeek: number
  messagesThisMonth: number
  activeUsers: number
  connectedChannels: number
  averageMessageLength: number
  topChannels: Array<{
    id: string
    name: string
    messageCount: number
    memberCount: number
  }>
  topUsers: Array<{
    id: string
    name: string
    messageCount: number
    squad: string
  }>
  topTags: Array<{
    id: string
    name: string
    usageCount: number
    category: string
  }>
  dailyActivity: Array<{
    date: string
    messages: number
    users: number
  }>
  squadActivity: Array<{
    squad: string
    messages: number
    users: number
    channels: number
  }>
}

interface Filters {
  dateRange: 'today' | 'week' | 'month' | 'custom'
  startDate?: string
  endDate?: string
  squads: string[]
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    dateRange: 'week',
    squads: []
  })
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [filters])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      console.log('Loading Analytics data...')
      
      // Load all data to calculate analytics
      const [messagesRes, channelsRes, usersRes, tagsRes] = await Promise.all([
        messagesApi.getMessages({}),
        channelsApi.getChannels(),
        usersApi.getUsers(),
        tagsApi.getTags()
      ])

      const messages = messagesRes.data?.messages || []
      const channels = channelsRes.data?.channels || []
      const users = usersRes.data?.users || []
      const tags = tagsRes.data?.tags || []

      // Calculate date range
      const now = new Date()
      let startDate: Date
      let endDate: Date

      switch (filters.dateRange) {
        case 'today':
          startDate = startOfDay(now)
          endDate = endOfDay(now)
          break
        case 'week':
          startDate = startOfDay(subDays(now, 7))
          endDate = endOfDay(now)
          break
        case 'month':
          startDate = startOfDay(subDays(now, 30))
          endDate = endOfDay(now)
          break
        default:
          startDate = startOfDay(subDays(now, 7))
          endDate = endOfDay(now)
      }

      // Filter messages by date range
      const filteredMessages = messages.filter(msg => {
        const msgDate = new Date(msg.timestamp)
        return msgDate >= startDate && msgDate <= endDate
      })

      // Calculate analytics
      const analytics: AnalyticsData = {
        totalMessages: messages.length,
        totalUsers: users.length,
        totalChannels: channels.length,
        totalTags: tags.length,
        messagesToday: messages.filter(msg => {
          const msgDate = new Date(msg.timestamp)
          return msgDate >= startOfDay(now) && msgDate <= endOfDay(now)
        }).length,
        messagesThisWeek: messages.filter(msg => {
          const msgDate = new Date(msg.timestamp)
          return msgDate >= startOfDay(subDays(now, 7)) && msgDate <= endOfDay(now)
        }).length,
        messagesThisMonth: messages.filter(msg => {
          const msgDate = new Date(msg.timestamp)
          return msgDate >= startOfDay(subDays(now, 30)) && msgDate <= endOfDay(now)
        }).length,
        activeUsers: new Set(filteredMessages.map(msg => msg.userId)).size,
        connectedChannels: channels.filter(c => c.isConnected).length,
        averageMessageLength: filteredMessages.length > 0 
          ? Math.round(filteredMessages.reduce((sum, msg) => sum + msg.text.length, 0) / filteredMessages.length)
          : 0,
        topChannels: calculateTopChannels(filteredMessages, channels),
        topUsers: calculateTopUsers(filteredMessages, users),
        topTags: calculateTopTags(tags),
        dailyActivity: calculateDailyActivity(filteredMessages, startDate, endDate),
        squadActivity: calculateSquadActivity(filteredMessages, users, channels)
      }

      setAnalyticsData(analytics)
    } catch (err) {
      console.error('Error loading analytics:', err)
      if (err instanceof Error) {
        setError(`Failed to load analytics: ${err.message}`)
      } else {
        setError('Failed to load analytics')
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateTopChannels = (messages: any[], channels: any[]) => {
    const channelCounts = messages.reduce((acc, msg) => {
      acc[msg.channelId] = (acc[msg.channelId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(channelCounts)
      .map(([channelId, count]) => {
        const channel = channels.find(c => c.id === channelId)
        return {
          id: channelId,
          name: channel?.name || channelId,
          messageCount: count,
          memberCount: channel?.memberCount || 0
        }
      })
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5)
  }

  const calculateTopUsers = (messages: any[], users: any[]) => {
    const userCounts = messages.reduce((acc, msg) => {
      acc[msg.userId] = (acc[msg.userId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(userCounts)
      .map(([userId, count]) => {
        const user = users.find(u => u.id === userId)
        return {
          id: userId,
          name: user?.name || userId,
          messageCount: count,
          squad: user?.squad || 'Unknown'
        }
      })
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5)
  }

  const calculateTopTags = (tags: any[]) => {
    return tags
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        usageCount: tag.usageCount,
        category: tag.category
      }))
  }

  const calculateDailyActivity = (messages: any[], startDate: Date, endDate: Date) => {
    const dailyData: Record<string, { messages: number; users: Set<string> }> = {}
    
    // Initialize all days in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = format(d, 'yyyy-MM-dd')
      dailyData[dateKey] = { messages: 0, users: new Set() }
    }

    // Count messages and users per day
    messages.forEach(msg => {
      const dateKey = format(new Date(msg.timestamp), 'yyyy-MM-dd')
      if (dailyData[dateKey]) {
        dailyData[dateKey].messages++
        dailyData[dateKey].users.add(msg.userId)
      }
    })

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      messages: data.messages,
      users: data.users.size
    }))
  }

  const calculateSquadActivity = (messages: any[], users: any[], channels: any[]) => {
    const squadData: Record<string, { messages: number; users: Set<string>; channels: Set<string> }> = {}
    
    // Initialize squad data
    users.forEach(user => {
      if (user.squad) {
        squadData[user.squad] = { messages: 0, users: new Set(), channels: new Set() }
      }
    })

    // Count messages per squad
    messages.forEach(msg => {
      const user = users.find(u => u.id === msg.userId)
      if (user?.squad && squadData[user.squad]) {
        squadData[user.squad].messages++
        squadData[user.squad].users.add(msg.userId)
      }
    })

    // Count channels per squad
    channels.forEach(channel => {
      if (channel.squad && squadData[channel.squad]) {
        squadData[channel.squad].channels.add(channel.id)
      }
    })

    return Object.entries(squadData).map(([squad, data]) => ({
      squad,
      messages: data.messages,
      users: data.users.size,
      channels: data.channels.size
    })).sort((a, b) => b.messages - a.messages)
  }

  const refreshAnalytics = async () => {
    try {
      setRefreshing(true)
      await loadAnalytics()
    } catch (err) {
      setError('Failed to refresh analytics')
      console.error('Error refreshing analytics:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      dateRange: 'week',
      squads: []
    })
  }

  if (loading && !analyticsData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
          <p className="text-gray-600">Analytics data could not be loaded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Insights and statistics about your Slack activity
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshAnalytics}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
                            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  dateRange: e.target.value as any 
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            {/* Squad Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Squad
              </label>
              <select
                value={filters.squads[0] || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  squads: e.target.value ? [e.target.value] : [] 
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Squads</option>
                {analyticsData.squadActivity.map(squad => (
                  <option key={squad.squad} value={squad.squad}>{squad.squad}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalMessages}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.activeUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Connected Channels</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.connectedChannels}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Message Length</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.averageMessageLength}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Today</span>
              <span className="text-sm font-medium">{analyticsData.messagesToday} messages</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="text-sm font-medium">{analyticsData.messagesThisWeek} messages</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-sm font-medium">{analyticsData.messagesThisMonth} messages</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Channels</h3>
          <div className="space-y-3">
            {analyticsData.topChannels.map((channel, index) => (
              <div key={channel.id} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">#{index + 1}</span>
                  <span className="text-sm text-gray-600">{channel.name}</span>
                </div>
                <span className="text-sm font-medium">{channel.messageCount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Users</h3>
          <div className="space-y-3">
            {analyticsData.topUsers.map((user, index) => (
              <div key={user.id} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">#{index + 1}</span>
                  <span className="text-sm text-gray-600">{user.name}</span>
                </div>
                <span className="text-sm font-medium">{user.messageCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Squad Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Squad Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Squad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channels
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.squadActivity.map((squad) => (
                <tr key={squad.squad}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {squad.squad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {squad.messages}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {squad.users}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {squad.channels}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Tags */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Tags</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData.topTags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{tag.name}</p>
                <p className="text-xs text-gray-500 capitalize">{tag.category}</p>
              </div>
              <span className="text-sm font-medium text-gray-900">{tag.usageCount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Analytics
