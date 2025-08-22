import React, { useState, useEffect, useCallback } from 'react';
import { messagesApi } from '../services/api';
import { Message } from '../types';
import MessageCard from '../components/MessageCard';
import SearchFilters from '../components/SearchFilters';

interface SearchFilters {
  search: string;
  squad: string;
  channelId: string;
  userId: string;
  startDate: string;
  endDate: string;
  minImportance: string;
  hasReactions: boolean;
  sortBy: string;
  sortOrder: string;
}

const Search: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    squad: '',
    channelId: '',
    userId: '',
    startDate: '',
    endDate: '',
    minImportance: '',
    hasReactions: false,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });

  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());

  const RESULTS_PER_PAGE = 20;

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      performSearch(true);
    }, 500),
    [filters]
  );

  useEffect(() => {
    if (filters.search || Object.values(filters).some(v => v && v !== 'timestamp' && v !== 'desc')) {
      debouncedSearch();
    }
  }, [filters, debouncedSearch]);

  const performSearch = async (resetPage = false) => {
    if (resetPage) {
      setCurrentPage(0);
      setMessages([]);
    }

    setLoading(true);
    setError(null);

    try {
      const page = resetPage ? 0 : currentPage;
      const params = {
        ...filters,
        limit: RESULTS_PER_PAGE,
        offset: page * RESULTS_PER_PAGE,
        hasReactions: filters.hasReactions ? 'true' : undefined,
      };

      // Remove empty parameters
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== '' && value !== undefined)
      );

      console.log('Performing search with params:', cleanParams);
      const response = await messagesApi.getMessages(cleanParams);

      if (response.success) {
        const newMessages = response.data.messages;
        
        if (resetPage) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...prev, ...newMessages]);
        }
        
        setTotalResults(response.data.total);
        setHasMore(response.data.offset + response.data.limit < response.data.total);
        
        if (!resetPage) {
          setCurrentPage(prev => prev + 1);
        }
        
        console.log(`Search completed: ${newMessages.length} new messages, ${response.data.total} total`);
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreResults = () => {
    if (!loading && hasMore) {
      performSearch(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      squad: '',
      channelId: '',
      userId: '',
      startDate: '',
      endDate: '',
      minImportance: '',
      hasReactions: false,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
    setMessages([]);
    setTotalResults(0);
    setCurrentPage(0);
  };

  const handleDismissMessage = (messageId: string) => {
    setDismissedMessages(prev => new Set([...prev, messageId]));
  };

  const visibleMessages = messages.filter(msg => !dismissedMessages.has(msg.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Message Search</h1>
          <p className="text-gray-600">
            Search and filter messages across all monitored channels
          </p>
        </div>

        {/* Search Filters */}
        <div className="mb-8">
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={clearFilters}
            loading={loading}
          />
        </div>

        {/* Results Summary */}
        {(totalResults > 0 || loading) && (
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {loading && messages.length === 0 ? (
                'Searching...'
              ) : (
                <>
                  Showing {visibleMessages.length} of {totalResults} results
                  {filters.search && (
                    <span className="ml-2">
                      for "<span className="font-medium">{filters.search}</span>"
                    </span>
                  )}
                </>
              )}
            </div>
            
            {totalResults > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Sort by: {filters.sortBy} ({filters.sortOrder})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
                <div className="mt-2">
                  <button
                    onClick={() => performSearch(true)}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {loading && messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching messages...</p>
            </div>
          ) : visibleMessages.length === 0 && totalResults === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(v => v && v !== 'timestamp' && v !== 'desc')
                  ? 'Try adjusting your search criteria'
                  : 'Start typing to search messages'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Message Results */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {visibleMessages.map((message) => (
                    <div key={message.id} className="p-4">
                      <MessageCard
                        message={message}
                        onDismiss={handleDismissMessage}
                        showImportanceScore={true}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center py-6">
                  <button
                    onClick={loadMoreResults}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : `Load More Results (${totalResults - messages.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Dismissed Messages */}
        {dismissedMessages.size > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dismissed Messages ({dismissedMessages.size})
            </h3>
            <div className="text-sm text-gray-600">
              Messages you've dismissed from search results
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default Search;
