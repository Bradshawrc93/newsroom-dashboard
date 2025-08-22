import React, { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { messagesApi, channelsApi, usersApi, tagsApi } from '@/services/api'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface Message {
  id: string
  channelId: string
  userId: string
  text: string
  timestamp: string
  threadId?: string
  reactions: Array<{ name: string; count: number }>
  tags: string[]
  squad?: string
  importance?: number
  summary?: string
  createdAt: string
}

interface Channel {
  id: string
  name: string
  squad?: string
  isPrivate: boolean
  memberCount: number
  isConnected: boolean
}

interface User {
  id: string
  name: string
  email: string
  squad?: string
  role?: string
  avatar?: string
}

interface Tag {
  id: string
  name: string
  category: 'keyword' | 'person' | 'squad' | 'custom'
  confidence: number
  usageCount: number
}

interface Filters {
  search: string
  channels: string[]
  users: string[]
  tags: string[]
  dateRange: 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  startDate?: string
  endDate?: string
  squad?: string
  importance?: number
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    channels: [],
    users: [],
    tags: [],
    dateRange: 'week'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (filters) {
      loadMessages()
    }
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading Messages page data...')
      
      const [messagesRes, channelsRes, usersRes, tagsRes] = await Promise.all([
        messagesApi.getMessages({}),
        channelsApi.getChannels(),
        usersApi.getUsers(),
        tagsApi.getTags()
      ])

      console.log('Messages response:', messagesRes)
      console.log('Channels response:', channelsRes)
      console.log('Users response:', usersRes)
      console.log('Tags response:', tagsRes)

      setMessages(messagesRes.data?.messages || [])
      setChannels(channelsRes.data?.channels || [])
      setUsers(usersRes.data?.users || [])
      setTags(tagsRes.data?.tags || [])
    } catch (err) {
      console.error('Error loading data:', err)
      if (err instanceof Error) {
        setError(`Failed to load data: ${err.message}`)
      } else {
        setError('Failed to load data')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await messagesApi.getMessages({})
      let filteredMessages = response.data?.messages || []

      // Apply filters
      if (filters.search) {
        filteredMessages = filteredMessages.filter(msg =>
          msg.text.toLowerCase().includes(filters.search.toLowerCase())
        )
      }

      if (filters.channels.length > 0) {
        filteredMessages = filteredMessages.filter(msg =>
          filters.channels.includes(msg.channelId)
        )
      }

      if (filters.users.length > 0) {
        filteredMessages = filteredMessages.filter(msg =>
          filters.users.includes(msg.userId)
        )
      }

      if (filters.tags.length > 0) {
        filteredMessages = filteredMessages.filter(msg =>
          filters.tags.some(tag => msg.tags.includes(tag))
        )
      }

      if (filters.importance) {
        filteredMessages = filteredMessages.filter(msg =>
          (msg.importance || 0) >= filters.importance!
        )
      }

      // Apply date range filter
      const now = new Date()
      let startDate: Date
      let endDate: Date

      switch (filters.dateRange) {
        case 'today':
          startDate = startOfDay(now)
          endDate = endOfDay(now)
          break
        case 'yesterday':
          startDate = startOfDay(subDays(now, 1))
          endDate = endOfDay(subDays(now, 1))
          break
        case 'week':
          startDate = startOfDay(subDays(now, 7))
          endDate = endOfDay(now)
          break
        case 'month':
          startDate = startOfDay(subDays(now, 30))
          endDate = endOfDay(now)
          break
        case 'custom':
          if (filters.startDate && filters.endDate) {
            startDate = new Date(filters.startDate)
            endDate = new Date(filters.endDate)
          } else {
            startDate = startOfDay(subDays(now, 7))
            endDate = endOfDay(now)
          }
          break
        default:
          startDate = startOfDay(subDays(now, 7))
          endDate = endOfDay(now)
      }

      filteredMessages = filteredMessages.filter(msg => {
        const msgDate = new Date(msg.timestamp)
        return msgDate >= startDate && msgDate <= endDate
      })

      setMessages(filteredMessages)
    } catch (err) {
      setError('Failed to load messages')
      console.error('Error loading messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId)
    return channel?.name || channelId
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user?.name || userId
  }

  const getUserAvatar = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user?.avatar
  }

  const getTagColor = (tagName: string) => {
    const tag = tags.find(t => t.name === tagName)
    if (!tag) return 'bg-gray-100 text-gray-800'
    
    switch (tag.category) {
      case 'keyword':
        return 'bg-blue-100 text-blue-800'
      case 'person':
        return 'bg-green-100 text-green-800'
      case 'squad':
        return 'bg-purple-100 text-purple-800'
      case 'custom':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImportanceColor = (importance: number) => {
    if (importance >= 0.8) return 'text-red-600'
    if (importance >= 0.6) return 'text-orange-600'
    if (importance >= 0.4) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      channels: [],
      users: [],
      tags: [],
      dateRange: 'week'
    })
  }

  const activeFiltersCount = [
    filters.search,
    filters.channels.length,
    filters.users.length,
    filters.tags.length,
    filters.importance
  ].filter(Boolean).length

  if (loading && messages.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
            onClick={loadData}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  console.log('Messages component rendering, messages count:', messages.length)
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">
            {messages.length} messages found
            {activeFiltersCount > 0 && ` (${activeFiltersCount} filters active)`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 rounded-lg border ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Messages
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search message content..."
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            {/* Importance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Importance
              </label>
              <select
                value={filters.importance || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  importance: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any importance</option>
                <option value="0.8">High (0.8+)</option>
                <option value="0.6">Medium (0.6+)</option>
                <option value="0.4">Low (0.4+)</option>
              </select>
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channels
              </label>
              <select
                multiple
                value={filters.channels}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  setFilters({ ...filters, channels: selected })
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Users */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Users
              </label>
              <select
                multiple
                value={filters.users}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  setFilters({ ...filters, users: selected })
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <select
                multiple
                value={filters.tags}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  setFilters({ ...filters, tags: selected })
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {tags.map(tag => (
                  <option key={tag.id} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedMessage(message)
              setShowDetail(true)
            }}
          >
            <div className="flex items-start space-x-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {getUserAvatar(message.userId) ? (
                  <img
                    src={getUserAvatar(message.userId)}
                    alt={getUserName(message.userId)}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {getUserName(message.userId)}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-blue-600">
                    #{getChannelName(message.channelId)}
                  </span>
                  {message.importance && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className={`text-sm font-medium ${getImportanceColor(message.importance)}`}>
                        {(message.importance * 100).toFixed(0)}% important
                      </span>
                    </>
                  )}
                </div>

                <p className="text-gray-900 mb-3 line-clamp-2">
                  {message.text}
                </p>

                {/* Tags */}
                {message.tags && message.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {message.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {message.reactions.map((reaction) => (
                      <span
                        key={reaction.name}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        :{reaction.name}: {reaction.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                <button className="text-gray-400 hover:text-gray-600">
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {messages.length === 0 && !loading && (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
          <p className="text-gray-600 mb-4">
            {activeFiltersCount > 0 
              ? 'Try adjusting your filters to see more messages.'
              : 'No messages have been loaded yet.'
            }
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Message Detail Modal */}
      {showDetail && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeSlashIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Message Header */}
                <div className="flex items-center space-x-3">
                  {getUserAvatar(selectedMessage.userId) ? (
                    <img
                      src={getUserAvatar(selectedMessage.userId)}
                      alt={getUserName(selectedMessage.userId)}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-12 w-12 text-gray-400" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {getUserName(selectedMessage.userId)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      #{getChannelName(selectedMessage.channelId)}
                    </p>
                  </div>
                </div>

                {/* Message Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedMessage.text}
                  </p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Sent:</span>
                    <span className="ml-2 text-gray-900">
                      {format(new Date(selectedMessage.timestamp), 'PPP p')}
                    </span>
                  </div>
                  {selectedMessage.importance && (
                    <div>
                      <span className="text-gray-500">Importance:</span>
                      <span className={`ml-2 font-medium ${getImportanceColor(selectedMessage.importance)}`}>
                        {(selectedMessage.importance * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {selectedMessage.squad && (
                    <div>
                      <span className="text-gray-500">Squad:</span>
                      <span className="ml-2 text-gray-900">{selectedMessage.squad}</span>
                    </div>
                  )}
                  {selectedMessage.threadId && (
                    <div>
                      <span className="text-gray-500">Thread:</span>
                      <span className="ml-2 text-gray-900">Yes</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedMessage.tags && selectedMessage.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMessage.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTagColor(tag)}`}
                        >
                          <TagIcon className="h-4 w-4 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reactions */}
                {selectedMessage.reactions && selectedMessage.reactions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Reactions</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMessage.reactions.map((reaction) => (
                        <span
                          key={reaction.name}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                        >
                          :{reaction.name}: {reaction.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedMessage.summary && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">AI Summary</h4>
                    <p className="text-gray-700 bg-blue-50 rounded-lg p-3">
                      {selectedMessage.summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages
