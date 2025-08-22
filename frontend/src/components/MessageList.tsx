import React, { useState, useEffect } from 'react';
import { messagesApi } from '../services/api';
import { format } from 'date-fns';
import { Message } from '../types';

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);


  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        limit: 50,
        offset: 0,
      };

      console.log('Loading messages with params:', params);
      const response = await messagesApi.getMessages(params);
      console.log('API response:', response);
      
      if (response.success) {
        setMessages(response.data.messages);
        setLastUpdated(new Date());
        console.log('Messages loaded:', response.data.messages.length);
      } else {
        const errorMessage = response.error || 'Failed to load messages';
        setError(errorMessage);
        console.error('API returned error:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Newsroom Dashboard</h2>

        {/* Controls and Status */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-4 items-center">
            <button
              onClick={loadMessages}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Messages'}
            </button>
            <div className="text-sm text-gray-600 flex items-center">
              {messages.length > 0 && `Showing ${messages.length} messages`}
            </div>
          </div>
          
          {/* Status Information */}
          <div className="flex gap-4 text-xs text-gray-500">
            {lastUpdated && (
              <span>
                Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
              </span>
            )}
            {loading && (
              <span className="text-blue-600">Fetching from 12 squad channels...</span>
            )}
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading messages
                  </h3>
                  <div className="mt-1 text-sm text-red-700">
                    {error}
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={loadMessages}
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

        {/* Messages List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No messages loaded yet. Click "Load Messages" to fetch messages from Slack.</p>
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
                          {message.userName}
                        </span>
                        <span className="text-sm text-gray-500">
                          in #{message.channelName}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(message.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>

                    <p className="text-gray-800">{message.text}</p>
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
