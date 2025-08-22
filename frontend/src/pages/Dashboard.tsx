import React, { useState, useEffect } from 'react';
import { messagesApi, aiApi } from '../services/api';
import { format } from 'date-fns';
import { Message } from '../types';
import MessageCard from '../components/MessageCard';
import DailySummary from '../components/DailySummary';
import SquadSection from '../components/SquadSection';

interface GroupedMessages {
  [squadName: string]: Message[];
}

interface DashboardStats {
  totalMessages: number;
  activeSquads: number;
  lastUpdated: Date | null;
  aiConnected: boolean;
}

type TimeRange = 'today' | 'week' | 'month' | 'lastMonth' | 'custom';

interface DateRangeConfig {
  label: string;
  icon: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
}

const Dashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    activeSquads: 0,
    lastUpdated: null,
    aiConnected: false
  });
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange>('today');
  const [customDate, setCustomDate] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    checkAIConnection();
  }, []);

  useEffect(() => {
    // Reload data when time range changes
    loadDashboardData();
  }, [activeTimeRange, customDate]);

  const getDateRangeConfig = (timeRange: TimeRange, customDate?: Date): DateRangeConfig => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeRange) {
      case 'today':
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        return {
          label: 'Today',
          icon: '📅',
          startDate: today,
          endDate: todayEnd,
          limit: undefined // No limit for today
        };
      
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        return {
          label: 'This Week',
          icon: '📊',
          startDate: weekStart,
          endDate: now,
          limit: undefined // No limit for week
        };
      
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          label: 'This Month',
          icon: '📈',
          startDate: monthStart,
          endDate: now,
          limit: undefined // No limit for month
        };
      
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        return {
          label: 'Last Month',
          icon: '📋',
          startDate: lastMonthStart,
          endDate: lastMonthEnd,
          limit: undefined // No limit for last month
        };
      
      case 'custom':
        const selectedDate = customDate || today;
        const customStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const customEnd = new Date(customStart);
        customEnd.setHours(23, 59, 59, 999);
        return {
          label: format(selectedDate, 'MMM dd'),
          icon: '🗓️',
          startDate: customStart,
          endDate: customEnd,
          limit: undefined // No limit for custom date
        };
      
      default:
        return getDateRangeConfig('today');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateConfig = getDateRangeConfig(activeTimeRange, customDate);
      console.log(`Loading dashboard data for ${dateConfig.label}...`);
      
      // Load messages with proper date filtering
      const params: any = {
        startDate: dateConfig.startDate.toISOString(),
        endDate: dateConfig.endDate.toISOString(),
        offset: 0,
      };

      // Only add limit for today view (others get unlimited)
      if (dateConfig.limit) {
        params.limit = dateConfig.limit;
      }

      const response = await messagesApi.getMessages(params);

      if (response.success) {
        const fetchedMessages = response.data.messages;
        setMessages(fetchedMessages);
        
        // Group messages by squad
        const grouped = groupMessagesBySquad(fetchedMessages);
        setGroupedMessages(grouped);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalMessages: fetchedMessages.length,
          activeSquads: Object.keys(grouped).length,
          lastUpdated: new Date()
        }));
        
        console.log(`Loaded ${fetchedMessages.length} messages across ${Object.keys(grouped).length} squads`);
      } else {
        throw new Error(response.error || 'Failed to load messages');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Dashboard loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAIConnection = async () => {
    try {
      const response = await aiApi.testConnection();
      setStats(prev => ({
        ...prev,
        aiConnected: response.success
      }));
    } catch (error) {
      console.warn('AI connection check failed:', error);
      setStats(prev => ({
        ...prev,
        aiConnected: false
      }));
    }
  };

  const groupMessagesBySquad = (messages: Message[]): GroupedMessages => {
    const grouped: GroupedMessages = {};
    
    messages.forEach(message => {
      const squad = inferSquadFromChannel(message.channelName || 'unknown');
      if (!grouped[squad]) {
        grouped[squad] = [];
      }
      grouped[squad].push(message);
    });

    // Sort messages within each squad by timestamp (newest first)
    Object.keys(grouped).forEach(squad => {
      grouped[squad].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });

    return grouped;
  };

  const inferSquadFromChannel = (channelName: string): string => {
    const name = channelName.toLowerCase();
    
    if (name.includes('voice') || name.includes('ai')) return 'Voice AI';
    if (name.includes('rcm') || name.includes('epic')) return 'Core RCM';
    if (name.includes('hitl')) return 'HITL';
    if (name.includes('portal')) return 'Portal Aggregator';
    if (name.includes('thoughthub')) return 'ThoughtHub';
    if (name.includes('nox')) return 'Nox Health';
    if (name.includes('orthofi')) return 'OrthoFi';
    if (name.includes('biowound')) return 'BioWound';
    if (name.includes('legent')) return 'Legent';
    
    return 'General';
  };

  const handleDismissMessage = (messageId: string) => {
    setDismissedMessages(prev => new Set([...prev, messageId]));
  };

  const handleRestoreMessage = (messageId: string) => {
    setDismissedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  };

  const getVisibleMessages = (squadMessages: Message[]) => {
    return squadMessages.filter(msg => 
      showDismissed || !dismissedMessages.has(msg.id)
    );
  };

  const getDismissedMessages = () => {
    return messages.filter(msg => dismissedMessages.has(msg.id));
  };

  // Squad priority order for display
  const squadPriority = [
    'Core RCM',
    'Voice AI', 
    'HITL',
    'Portal Aggregator',
    'ThoughtHub',
    'Nox Health',
    'OrthoFi',
    'BioWound',
    'Legent',
    'General'
  ];

  const sortedSquads = Object.keys(groupedMessages).sort((a, b) => {
    const aIndex = squadPriority.indexOf(a);
    const bIndex = squadPriority.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Newsroom Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Product team activity monitoring and insights
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* AI Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${stats.aiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  AI {stats.aiConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Time Range Controls */}
          <div className="bg-white rounded-lg p-4 shadow mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                
                {/* Quick Select Buttons */}
                <div className="flex space-x-1">
                  {[
                    { key: 'today' as TimeRange, label: 'Today', icon: '📅' },
                    { key: 'week' as TimeRange, label: 'This Week', icon: '📊' },
                    { key: 'month' as TimeRange, label: 'This Month', icon: '📈' },
                    { key: 'lastMonth' as TimeRange, label: 'Last Month', icon: '📋' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setActiveTimeRange(option.key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTimeRange === option.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Picker */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Or choose a day:</span>
                <input
                  type="date"
                  value={format(customDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    setCustomDate(new Date(e.target.value));
                    setActiveTimeRange('custom');
                  }}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Current Selection Display */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Showing:</span>
                  <span className="font-medium text-gray-900">
                    {getDateRangeConfig(activeTimeRange, customDate).icon} {getDateRangeConfig(activeTimeRange, customDate).label}
                  </span>
                  {activeTimeRange !== 'today' && (
                    <span className="text-gray-500">
                      ({format(getDateRangeConfig(activeTimeRange, customDate).startDate, 'MMM dd')} - {format(getDateRangeConfig(activeTimeRange, customDate).endDate, 'MMM dd')})
                    </span>
                  )}
                </div>
                <div className="text-gray-500">
                  {activeTimeRange === 'today' ? 'No message limit' : 'All messages in range'}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-2xl font-bold text-green-600">{stats.activeSquads}</div>
              <div className="text-sm text-gray-600">Active Squads</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-2xl font-bold text-purple-600">{dismissedMessages.size}</div>
              <div className="text-sm text-gray-600">Dismissed</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600">Last Updated</div>
              <div className="text-sm font-medium">
                {stats.lastUpdated ? format(stats.lastUpdated, 'MMM dd, HH:mm') : 'Never'}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                  <div className="mt-2">
                    <button
                      onClick={loadDashboardData}
                      className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Daily Summary Section */}
        <div className="mb-8">
          {/* Only show daily summary for single-day views */}
          {(activeTimeRange === 'today' || activeTimeRange === 'custom') && (
            <DailySummary 
              selectedDate={activeTimeRange === 'today' ? new Date() : customDate}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          ) : sortedSquads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No messages found. Click "Refresh" to load messages from Slack.</p>
            </div>
          ) : (
            <>
              {/* Squad Sections */}
              {sortedSquads.map(squadName => {
                const squadMessages = getVisibleMessages(groupedMessages[squadName]);
                if (squadMessages.length === 0) return null;

                return (
                  <SquadSection
                    key={squadName}
                    squadName={squadName}
                    messages={squadMessages}
                    onDismissMessage={handleDismissMessage}
                  />
                );
              })}

              {/* Dismissed Messages Section */}
              {dismissedMessages.size > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Dismissed Messages ({dismissedMessages.size})
                    </h2>
                    <button
                      onClick={() => setShowDismissed(!showDismissed)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showDismissed ? 'Hide' : 'Show'} Dismissed
                    </button>
                  </div>

                  {showDismissed && (
                    <div className="space-y-3">
                      {getDismissedMessages().map(message => (
                        <MessageCard
                          key={message.id}
                          message={message}
                          onDismiss={() => handleRestoreMessage(message.id)}
                          isDismissed={true}
                          dismissButtonText="Restore"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
