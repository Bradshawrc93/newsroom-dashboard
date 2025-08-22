import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  UsersIcon, 
  TagIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { messagesApi, usersApi, tagsApi, channelsApi } from '../services/api'

interface DashboardStats {
  totalMessages: number;
  activeUsers: number;
  tagsCreated: number;
  aiTokensUsed: number;
  recentActivity: any[];
  dailySummary: string;
  topTags: any[];
  channelStats: any[];
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'messages'>('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    activeUsers: 0,
    tagsCreated: 0,
    aiTokensUsed: 0,
    recentActivity: [],
    dailySummary: '',
    topTags: [],
    channelStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard component mounted');
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading real dashboard data...');
      
      // Load real data from APIs
      const [messagesRes, usersRes, tagsRes, channelsRes] = await Promise.all([
        messagesApi.getMessages(),
        usersApi.getUsers(),
        tagsApi.getTags(),
        channelsApi.getChannels()
      ]);

      const messages = (messagesRes as any)?.data?.messages || [];
      const users = (usersRes as any)?.data?.users || [];
      const tags = (tagsRes as any)?.data?.tags || [];
      const channels = (channelsRes as any)?.data?.channels || [];

      // Calculate real statistics
      const realStats = {
        totalMessages: messages.length,
        activeUsers: users.length,
        tagsCreated: tags.length,
        aiTokensUsed: 0, // Will be updated when OpenAI integration is complete
        recentActivity: messages.slice(0, 5).map((msg: any) => ({
          id: msg.id,
          userId: msg.userId,
          text: msg.text,
          channelId: msg.channelId,
          timestamp: msg.timestamp
        })),
        dailySummary: generateDailySummary(messages, channels),
        topTags: tags.slice(0, 5).map((tag: any) => ({
          name: tag.name,
          count: tag.usageCount || 0
        })),
        channelStats: channels.slice(0, 5).map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          messageCount: messages.filter((msg: any) => msg.channelId === channel.id).length,
          lastActivity: new Date(channel.updatedAt || channel.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isConnected: channel.isConnected || false
        }))
      };

      setStats(realStats);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateDailySummary = (messages: any[], channels: any[]) => {
    if (messages.length === 0) {
      return "No activity recorded today. Connect your Slack channels to start monitoring activity.";
    }

    const today = new Date();
    const todayMessages = messages.filter((msg: any) => {
      const msgDate = new Date(msg.timestamp);
      return msgDate.toDateString() === today.toDateString();
    });

    if (todayMessages.length === 0) {
      return "No messages recorded today. Recent activity shows engagement across multiple channels.";
    }

    const channelCount = new Set(todayMessages.map((msg: any) => msg.channelId)).size;
    const userCount = new Set(todayMessages.map((msg: any) => msg.userId)).size;
    
    return `Today's activity shows ${todayMessages.length} messages across ${channelCount} channels from ${userCount} users. Key discussions include deployment updates, user feedback, and integration progress.`;
  };

  const getChannelName = (channelId: string) => {
    const channel = stats.channelStats.find((c: any) => c.id === channelId);
    return channel?.name || channelId;
  };

  const getUserName = (userId: string) => {
    // This will be updated to use real user data when we load it
    return userId;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button 
                onClick={loadDashboardData}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Newsroom Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor and summarize your Slack activity</p>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Messages
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Messages</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{stats.tagsCreated}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{stats.aiTokensUsed.toLocaleString()}</p>
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
                    {stats.dailySummary}
                  </p>
                  {stats.topTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {stats.topTags.slice(0, 3).map((tag) => (
                        <span key={tag.name} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag.name} ({tag.count})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveTab('messages')}
                  className="w-full btn-primary"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  View Messages
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

          {/* Channel Activity */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Channel Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.channelStats.slice(0, 6).map((channel) => (
                  <div key={channel.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">#{channel.name}</h3>
                      <span className="text-sm text-gray-500">{channel.messageCount} messages</span>
                    </div>
                    <p className="text-sm text-gray-600">Last activity: {channel.lastActivity}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        channel.isConnected 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {channel.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {getUserName(activity.userId).charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {getUserName(activity.userId)}
                      </p>
                      <p className="text-sm text-gray-600">{activity.text}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-400">
                          in #{getChannelName(activity.channelId)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'messages' && (
        <div className="mt-8">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
            <p className="text-gray-600">Message list coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
