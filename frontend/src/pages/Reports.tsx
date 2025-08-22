import React, { useState, useEffect } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { messagesApi, aiApi } from '../services/api';
import { Message } from '../types';

interface ReportData {
  messages: Message[];
  totalMessages: number;
  messagesBySquad: Record<string, number>;
  messagesByChannel: Record<string, number>;
  topUsers: Array<{ name: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
  averageImportance: number;
  messagesWithReactions: number;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedSquads, setSelectedSquads] = useState<string[]>([]);

  const predefinedRanges = [
    {
      label: 'Last 7 days',
      start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    {
      label: 'This week',
      start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    },
    {
      label: 'This month',
      start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    }
  ];

  const squads = [
    'Voice AI', 'Core RCM', 'HITL', 'Portal Aggregator', 'ThoughtHub',
    'Nox Health', 'OrthoFi', 'BioWound', 'Legent', 'General'
  ];

  useEffect(() => {
    generateReport();
  }, [dateRange]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Generating report for date range:', dateRange);

      // Fetch messages for the date range
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        limit: 1000, // Get more messages for comprehensive report
        offset: 0
      };

      const response = await messagesApi.getMessages(params);

      if (response.success) {
        const messages = response.data.messages;
        
        // Process the data into report format
        const processedData = processReportData(messages);
        setReportData(processedData);
        
        console.log('Report generated successfully:', processedData);
      } else {
        throw new Error(response.error || 'Failed to fetch messages for report');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      setError(errorMessage);
      console.error('Report generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (messages: Message[]): ReportData => {
    // Filter by selected squads if any
    let filteredMessages = messages;
    if (selectedSquads.length > 0) {
      filteredMessages = messages.filter(msg => {
        const squad = inferSquadFromChannel(msg.channelName || '');
        return selectedSquads.includes(squad);
      });
    }

    // Messages by squad
    const messagesBySquad: Record<string, number> = {};
    filteredMessages.forEach(msg => {
      const squad = inferSquadFromChannel(msg.channelName || '');
      messagesBySquad[squad] = (messagesBySquad[squad] || 0) + 1;
    });

    // Messages by channel
    const messagesByChannel: Record<string, number> = {};
    filteredMessages.forEach(msg => {
      const channel = msg.channelName || 'Unknown';
      messagesByChannel[channel] = (messagesByChannel[channel] || 0) + 1;
    });

    // Top users
    const userCounts: Record<string, number> = {};
    filteredMessages.forEach(msg => {
      const user = msg.userName || 'Unknown';
      userCounts[user] = (userCounts[user] || 0) + 1;
    });
    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Daily activity
    const dailyActivity: Record<string, number> = {};
    filteredMessages.forEach(msg => {
      const date = format(new Date(msg.timestamp), 'yyyy-MM-dd');
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });
    const dailyActivityArray = Object.entries(dailyActivity)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Calculate metrics
    const messagesWithReactions = filteredMessages.filter(msg => 
      msg.reactions && msg.reactions.length > 0
    ).length;

    // Simple importance estimation
    const totalImportance = filteredMessages.reduce((sum, msg) => {
      return sum + estimateMessageImportance(msg);
    }, 0);
    const averageImportance = filteredMessages.length > 0 ? totalImportance / filteredMessages.length : 0;

    return {
      messages: filteredMessages,
      totalMessages: filteredMessages.length,
      messagesBySquad,
      messagesByChannel,
      topUsers,
      dailyActivity: dailyActivityArray,
      averageImportance,
      messagesWithReactions
    };
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

  const estimateMessageImportance = (message: Message): number => {
    let importance = 0.3;
    
    if (message.reactions && message.reactions.length > 0) {
      const totalReactions = message.reactions.reduce((sum, r) => sum + r.count, 0);
      importance += Math.min(totalReactions * 0.1, 0.3);
    }
    
    const wordCount = message.text.split(' ').length;
    if (wordCount > 50) importance += 0.1;
    if (wordCount > 100) importance += 0.1;
    
    const importantKeywords = ['urgent', 'critical', 'issue', 'bug', 'deployment', 'release'];
    const messageText = message.text.toLowerCase();
    const keywordMatches = importantKeywords.filter(keyword => 
      messageText.includes(keyword)
    ).length;
    
    importance += Math.min(keywordMatches * 0.05, 0.2);
    
    return Math.min(importance, 1);
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportText = generateReportText(reportData);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsroom-report-${dateRange.start}-to-${dateRange.end}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportText = (data: ReportData): string => {
    const lines = [
      'NEWSROOM DASHBOARD REPORT',
      '========================',
      '',
      `Report Period: ${format(new Date(dateRange.start), 'MMM dd, yyyy')} - ${format(new Date(dateRange.end), 'MMM dd, yyyy')}`,
      `Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`,
      '',
      'SUMMARY',
      '-------',
      `Total Messages: ${data.totalMessages}`,
      `Messages with Reactions: ${data.messagesWithReactions} (${Math.round(data.messagesWithReactions / data.totalMessages * 100)}%)`,
      `Average Importance Score: ${Math.round(data.averageImportance * 100)}%`,
      '',
      'ACTIVITY BY SQUAD',
      '-----------------',
      ...Object.entries(data.messagesBySquad)
        .sort(([, a], [, b]) => b - a)
        .map(([squad, count]) => `${squad}: ${count} messages`),
      '',
      'TOP CHANNELS',
      '------------',
      ...Object.entries(data.messagesByChannel)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([channel, count]) => `#${channel}: ${count} messages`),
      '',
      'TOP CONTRIBUTORS',
      '----------------',
      ...data.topUsers.map(user => `${user.name}: ${user.count} messages`),
      '',
      'DAILY ACTIVITY',
      '--------------',
      ...data.dailyActivity.map(day => `${format(new Date(day.date), 'MMM dd')}: ${day.count} messages`),
    ];

    return lines.join('\n');
  };

  const handleSquadToggle = (squad: string) => {
    setSelectedSquads(prev => 
      prev.includes(squad)
        ? prev.filter(s => s !== squad)
        : [...prev, squad]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">
          Generate custom reports and analyze team activity patterns
        </p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {predefinedRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => setDateRange({ start: range.start, end: range.end })}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Squad Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Squads (optional)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {squads.map((squad) => (
                <label key={squad} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSquads.includes(squad)}
                    onChange={() => handleSquadToggle(squad)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{squad}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          {reportData && (
            <button
              onClick={exportReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export Report
            </button>
          )}
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
              <h3 className="text-sm font-medium text-red-800">Report Generation Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Report Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating report...</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-blue-600">{reportData.totalMessages}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-green-600">{Object.keys(reportData.messagesBySquad).length}</div>
              <div className="text-sm text-gray-600">Active Squads</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-purple-600">{Math.round(reportData.averageImportance * 100)}%</div>
              <div className="text-sm text-gray-600">Avg Importance</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-orange-600">{reportData.messagesWithReactions}</div>
              <div className="text-sm text-gray-600">With Reactions</div>
            </div>
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Messages by Squad */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages by Squad</h3>
              <div className="space-y-3">
                {Object.entries(reportData.messagesBySquad)
                  .sort(([, a], [, b]) => b - a)
                  .map(([squad, count]) => (
                    <div key={squad} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{squad}</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / reportData.totalMessages) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
              <div className="space-y-3">
                {reportData.topUsers.slice(0, 8).map((user, index) => (
                  <div key={user.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{user.count} messages</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
            <div className="overflow-x-auto">
              <div className="flex items-end space-x-2 h-32">
                {reportData.dailyActivity.map((day) => {
                  const maxCount = Math.max(...reportData.dailyActivity.map(d => d.count));
                  const height = (day.count / maxCount) * 100;
                  
                  return (
                    <div key={day.date} className="flex flex-col items-center">
                      <div 
                        className="bg-blue-500 rounded-t min-w-8 flex items-end justify-center text-xs text-white font-medium"
                        style={{ height: `${height}%`, minHeight: '20px' }}
                      >
                        {day.count}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-top-left">
                        {format(new Date(day.date), 'MM/dd')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 00-2 2v6a2 2 0 01-2 2H9z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
          <p className="text-gray-600">Configure your date range and click "Generate Report" to get started</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
