import React, { useState } from 'react';
import { format } from 'date-fns';

interface SearchFiltersProps {
  filters: {
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
  };
  onFilterChange: (filters: any) => void;
  onClear: () => void;
  loading?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFilterChange,
  onClear,
  loading = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const squads = [
    { value: '', label: 'All Squads' },
    { value: 'voice-ai', label: 'Voice AI' },
    { value: 'core-rcm', label: 'Core RCM' },
    { value: 'hitl', label: 'HITL' },
    { value: 'portal-aggregator', label: 'Portal Aggregator' },
    { value: 'thoughthub', label: 'ThoughtHub' },
    { value: 'nox-health', label: 'Nox Health' },
    { value: 'orthofi', label: 'OrthoFi' },
    { value: 'biowound', label: 'BioWound' },
    { value: 'legent', label: 'Legent' },
    { value: 'general', label: 'General' }
  ];

  const sortOptions = [
    { value: 'timestamp', label: 'Date' },
    { value: 'importance', label: 'Importance' },
    { value: 'reactions', label: 'Reactions' },
    { value: 'username', label: 'User' },
    { value: 'channel', label: 'Channel' }
  ];

  const importanceOptions = [
    { value: '', label: 'Any Importance' },
    { value: '0.2', label: 'Low or higher (20%+)' },
    { value: '0.4', label: 'Medium or higher (40%+)' },
    { value: '0.6', label: 'High or higher (60%+)' },
    { value: '0.8', label: 'Critical only (80%+)' }
  ];

  const handleInputChange = (field: string, value: any) => {
    onFilterChange({ [field]: value });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.squad) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.minImportance) count++;
    if (filters.hasReactions) count++;
    if (filters.sortBy !== 'timestamp') count++;
    if (filters.sortOrder !== 'desc') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Main Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              placeholder="Search messages, users, or channels..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2">
          <select
            value={filters.squad}
            onChange={(e) => handleInputChange('squad', e.target.value)}
            className="block px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            {squads.map(squad => (
              <option key={squad.value} value={squad.value}>
                {squad.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showAdvanced || activeFilterCount > 2
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Advanced
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-100 bg-blue-600 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={onClear}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                min={filters.startDate || undefined}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Importance and Reactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Importance
              </label>
              <select
                value={filters.minImportance}
                onChange={(e) => handleInputChange('minImportance', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {importanceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reactions
              </label>
              <div className="flex items-center h-10">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasReactions}
                    onChange={(e) => handleInputChange('hasReactions', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Only messages with reactions
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleInputChange('sortBy', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="desc">Descending (Newest/Highest first)</option>
                <option value="asc">Ascending (Oldest/Lowest first)</option>
              </select>
            </div>
          </div>

          {/* Search Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Search Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use quotes for exact phrases: "deployment complete"</li>
              <li>• Search usernames: @username or just username</li>
              <li>• Search channels: #channel-name or just channel-name</li>
              <li>• Combine filters for more precise results</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
