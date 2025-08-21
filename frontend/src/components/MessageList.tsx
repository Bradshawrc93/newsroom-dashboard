import React, { useState, useEffect } from 'react';
import { messagesApi, channelsApi } from '../services/api';
import { format } from 'date-fns';

interface Message {
  id: string;
  text: string;
  userId: string;
  channelId: string;
  timestamp: string;
  tags: string[];
  importance?: number;
}

interface Channel {
  id: string;
  name: string;
  isConnected: boolean;
}

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChannels();
    loadMessages();
  }, []);

  const loadChannels = async () => {
    try {
      const response = await channelsApi.getChannels();
      if ((response.data as any)?.success) {
        setChannels((response.data as any).data.channels);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: 50,
        offset: 0,
      };

      if (selectedChannel) {
        params.channelId = selectedChannel;
      }

      if (dateRange.startDate) {
        params.startDate = new Date(dateRange.startDate).toISOString();
      }

      if (dateRange.endDate) {
        params.endDate = new Date(dateRange.endDate).toISOString();
      }

      const response = await messagesApi.getMessages(params);
      if ((response.data as any)?.success) {
        setMessages((response.data as any).data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesFromChannel = async (channelId: string) => {
    setLoading(true);
    try {
      const request = {
        channelId,
        startDate: new Date(dateRange.startDate).toISOString(),
        endDate: new Date(dateRange.endDate).toISOString(),
        limit: 100,
      };

      const response = await messagesApi.fetchMessages(request);
      if (response.data.success) {
        // Reload messages after fetching
        await loadMessages();
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMessages = async () => {
    if (!searchQuery.trim()) {
      await loadMessages();
      return;
    }

    setLoading(true);
    try {
      const request: any = {
        query: searchQuery,
        limit: 50,
      };

      if (selectedChannel) {
        request.channelIds = [selectedChannel];
      }

      if (dateRange.startDate) {
        request.startDate = new Date(dateRange.startDate).toISOString();
      }

      if (dateRange.endDate) {
        request.endDate = new Date(dateRange.endDate).toISOString();
      }

      const response = await messagesApi.searchMessages(request);
      if ((response.data as any)?.success) {
        setMessages((response.data as any).data.messages);
      }
    } catch (error) {
      console.error('Failed to search messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.name || channelId;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Message Management</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Channels</option>
              {channels
                .filter(channel => channel.isConnected)
                .map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={searchMessages}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={loadMessages}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Messages'}
          </button>

          {selectedChannel && (
            <button
              onClick={() => fetchMessagesFromChannel(selectedChannel)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Fetching...' : 'Fetch from Slack'}
            </button>
          )}

          <button
            onClick={() => {
              setSelectedChannel('');
              setSearchQuery('');
              setDateRange({
                startDate: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
              });
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear Filters
          </button>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No messages found. Try adjusting your filters or fetching messages from Slack.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Messages ({messages.length})
                </h3>
              </div>

              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {message.userId}
                        </span>
                        <span className="text-sm text-gray-500">
                          in #{getChannelName(message.channelId)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(message.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>

                    <p className="text-gray-800 mb-2">{message.text}</p>

                    {message.tags && message.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {message.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {message.importance && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Importance: </span>
                        <span className="text-xs font-medium">
                          {Math.round(message.importance * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageList;
