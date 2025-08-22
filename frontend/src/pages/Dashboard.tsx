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

  useEffect(() => {
    loadDashboardData();
    checkAIConnection();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading dashboard data...');
      
      // Load messages
      const response = await messagesApi.getMessages({
        limit: 100,
        offset: 0,
      });

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
          <DailySummary />
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
