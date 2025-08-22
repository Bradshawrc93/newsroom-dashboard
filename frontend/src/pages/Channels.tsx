import React, { useState, useEffect } from 'react'
import { 
  HashtagIcon, 
  UserGroupIcon,
  SignalIcon,
  SignalSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { channelsApi, usersApi, tagsApi } from '@/services/api'
import { format } from 'date-fns'

interface Channel {
  id: string
  name: string
  squad?: string
  isPrivate: boolean
  memberCount: number
  isConnected: boolean
  createdAt: string
  lastActivity?: string
  description?: string
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
  squads: string[]
  connectionStatus: 'all' | 'connected' | 'disconnected'
  privacy: 'all' | 'public' | 'private'
}

const Channels: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    squads: [],
    connectionStatus: 'all',
    privacy: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (filters) {
      loadChannels()
    }
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading Channels page data...')
      
      const [channelsRes, usersRes, tagsRes] = await Promise.all([
        channelsApi.getChannels(),
        usersApi.getUsers(),
        tagsApi.getTags()
      ])

      console.log('Channels response:', channelsRes)
      console.log('Users response:', usersRes)
      console.log('Tags response:', tagsRes)

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

  const loadChannels = async () => {
    try {
      setLoading(true)
      const response = await channelsApi.getChannels()
      let filteredChannels = response.data?.channels || []

      // Apply filters
      if (filters.search) {
        filteredChannels = filteredChannels.filter(channel =>
          channel.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          channel.description?.toLowerCase().includes(filters.search.toLowerCase())
        )
      }

      if (filters.squads.length > 0) {
        filteredChannels = filteredChannels.filter(channel =>
          channel.squad && filters.squads.includes(channel.squad)
        )
      }

      if (filters.connectionStatus !== 'all') {
        filteredChannels = filteredChannels.filter(channel =>
          filters.connectionStatus === 'connected' ? channel.isConnected : !channel.isConnected
        )
      }

      if (filters.privacy !== 'all') {
        filteredChannels = filteredChannels.filter(channel =>
          filters.privacy === 'private' ? channel.isPrivate : !channel.isPrivate
        )
      }

      setChannels(filteredChannels)
    } catch (err) {
      setError('Failed to load channels')
      console.error('Error loading channels:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshChannels = async () => {
    try {
      setRefreshing(true)
      await channelsApi.refreshChannels()
      await loadData()
    } catch (err) {
      setError('Failed to refresh channels')
      console.error('Error refreshing channels:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const connectChannel = async (channelId: string) => {
    try {
      await channelsApi.connectChannel(channelId)
      await loadData()
    } catch (err) {
      setError('Failed to connect channel')
      console.error('Error connecting channel:', err)
    }
  }

  const disconnectChannel = async (channelId: string) => {
    try {
      await channelsApi.disconnectChannel(channelId)
      await loadData()
    } catch (err) {
      setError('Failed to disconnect channel')
      console.error('Error disconnecting channel:', err)
    }
  }

  const getSquadName = (squadId: string) => {
    // This would typically come from a squads API
    return squadId || 'General'
  }

  const getChannelIcon = (channel: Channel) => {
    if (channel.isPrivate) {
      return <UserGroupIcon className="h-5 w-5 text-gray-500" />
    }
    return <HashtagIcon className="h-5 w-5 text-gray-500" />
  }

  const getConnectionStatus = (channel: Channel) => {
    if (channel.isConnected) {
      return (
        <div className="flex items-center text-green-600">
          <SignalIcon className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Connected</span>
        </div>
      )
    }
    return (
      <div className="flex items-center text-red-600">
        <SignalSlashIcon className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Disconnected</span>
      </div>
    )
  }

  const getPrivacyBadge = (channel: Channel) => {
    if (channel.isPrivate) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Private
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Public
      </span>
    )
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      squads: [],
      connectionStatus: 'all',
      privacy: 'all'
    })
  }

  const activeFiltersCount = [
    filters.search,
    filters.squads.length,
    filters.connectionStatus !== 'all',
    filters.privacy !== 'all'
  ].filter(Boolean).length

  // Get unique squads from channels
  const availableSquads = Array.from(new Set(channels.map(c => c.squad).filter(Boolean)))

  if (loading && channels.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Channels</h1>
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
          <p className="text-gray-600 mt-1">
            Manage your Slack channels and connections
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshChannels}
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
            {activeFiltersCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search channels..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
                {availableSquads.map(squad => (
                  <option key={squad} value={squad}>{squad}</option>
                ))}
              </select>
            </div>

            {/* Connection Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection Status
              </label>
              <select
                value={filters.connectionStatus}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  connectionStatus: e.target.value as any 
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="connected">Connected</option>
                <option value="disconnected">Disconnected</option>
              </select>
            </div>

            {/* Privacy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Privacy
              </label>
              <select
                value={filters.privacy}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  privacy: e.target.value as any 
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {channels.length} channels found
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <HashtagIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Channels</p>
              <p className="text-2xl font-bold text-gray-900">{channels.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <SignalIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Connected</p>
              <p className="text-2xl font-bold text-gray-900">
                {channels.filter(c => c.isConnected).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Private</p>
              <p className="text-2xl font-bold text-gray-900">
                {channels.filter(c => c.isPrivate).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {channels.reduce((sum, c) => sum + c.memberCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {channels.length} channels found
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {channels.map((channel) => (
            <div key={channel.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getChannelIcon(channel)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {channel.name}
                      </h3>
                      {getPrivacyBadge(channel)}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>{channel.memberCount} members</span>
                      {channel.squad && (
                        <span>Squad: {getSquadName(channel.squad)}</span>
                      )}
                      <span>Created {format(new Date(channel.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    {channel.description && (
                      <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {getConnectionStatus(channel)}
                  
                  <div className="flex items-center space-x-2">
                    {channel.isConnected ? (
                      <button
                        onClick={() => disconnectChannel(channel.id)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => connectChannel(channel.id)}
                        className="inline-flex items-center px-3 py-1 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Connect
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedChannel(channel)
                        setShowDetail(true)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {channels.length === 0 && !loading && (
        <div className="text-center py-12">
          <HashtagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No channels found</h3>
          <p className="text-gray-600 mb-4">
            {activeFiltersCount > 0 
              ? 'Try adjusting your filters to see more channels.'
              : 'No channels have been loaded yet.'
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

      {/* Channel Detail Modal */}
      {showDetail && selectedChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Channel Details</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeSlashIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Channel Header */}
                <div className="flex items-center space-x-3">
                  {getChannelIcon(selectedChannel)}
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">
                      #{selectedChannel.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getPrivacyBadge(selectedChannel)}
                      {getConnectionStatus(selectedChannel)}
                    </div>
                  </div>
                </div>

                {/* Channel Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Members:</span>
                      <span className="ml-2 text-gray-900">{selectedChannel.memberCount}</span>
                    </div>
                    {selectedChannel.squad && (
                      <div>
                        <span className="text-gray-500">Squad:</span>
                        <span className="ml-2 text-gray-900">{getSquadName(selectedChannel.squad)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">
                        {format(new Date(selectedChannel.createdAt), 'PPP')}
                      </span>
                    </div>
                    {selectedChannel.lastActivity && (
                      <div>
                        <span className="text-gray-500">Last Activity:</span>
                        <span className="ml-2 text-gray-900">
                          {format(new Date(selectedChannel.lastActivity), 'PPP p')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedChannel.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 bg-blue-50 rounded-lg p-3">
                      {selectedChannel.description}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Channel ID: {selectedChannel.id}
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedChannel.isConnected ? (
                      <button
                        onClick={() => {
                          disconnectChannel(selectedChannel.id)
                          setShowDetail(false)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XCircleIcon className="h-4 w-4 mr-2" />
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          connectChannel(selectedChannel.id)
                          setShowDetail(false)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Channels
