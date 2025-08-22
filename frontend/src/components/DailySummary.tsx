import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { aiApi } from '../services/api';

interface DailySummaryData {
  id: string;
  date: Date;
  content: string;
  keyPoints: string[];
  actionItems: string[];
  messageCount: number;
  squads: string[];
  createdAt: Date;
}

interface DailySummaryProps {
  selectedDate?: Date;
}

const DailySummary: React.FC<DailySummaryProps> = ({ 
  selectedDate: propSelectedDate 
}) => {
  const [summary, setSummary] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || new Date());

  useEffect(() => {
    loadDailySummary(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    // Sync with prop changes
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  const loadDailySummary = async (date: Date) => {
    setLoading(true);
    setError(null);

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      console.log('Loading daily summary for:', dateString);

      const response = await aiApi.getDailySummary(dateString);
      
      if (response.success) {
        setSummary(response.data);
        console.log('Daily summary loaded:', response.data);
      } else {
        // Try to generate a new summary if one doesn't exist
        console.log('No existing summary found, generating new one...');
        await generateDailySummary(date);
      }
    } catch (error) {
      console.log('Failed to load summary, will try to generate:', error);
      // Try to generate if loading failed
      await generateDailySummary(date);
    } finally {
      setLoading(false);
    }
  };

  const generateDailySummary = async (date: Date, forceRegenerate = false) => {
    setLoading(true);
    setError(null);

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      console.log('Generating daily summary for:', dateString);

      const response = await aiApi.generateDailySummary(dateString, forceRegenerate);
      
      if (response.success) {
        // Convert the generated summary to our expected format
        const generatedData = response.data;
        const summaryData: DailySummaryData = {
          id: `summary-${dateString}`,
          date: new Date(generatedData.date),
          content: generatedData.summary.executiveSummary,
          keyPoints: generatedData.summary.keyDevelopments || [],
          actionItems: generatedData.summary.actionItems || [],
          messageCount: generatedData.messageCount,
          squads: generatedData.squadsAnalyzed,
          createdAt: new Date(generatedData.generatedAt)
        };
        
        setSummary(summaryData);
        console.log('Daily summary generated:', summaryData);
      } else {
        throw new Error(response.error || 'Failed to generate summary');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
      setError(errorMessage);
      console.error('Summary generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    generateDailySummary(selectedDate, true);
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM dd, yyyy');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold">Daily Summary</h2>
              <p className="text-blue-100 text-sm">{formatDate(selectedDate)}</p>
            </div>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              {summary ? 'Regenerating summary...' : 'Generating daily summary...'}
            </span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Unable to load summary</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={() => generateDailySummary(selectedDate)}
                  className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : !summary ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">No summary available for this date</p>
            <button
              onClick={() => generateDailySummary(selectedDate)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate Summary
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h3>
              <p className="text-gray-700 leading-relaxed">{summary.content}</p>
            </div>

            {/* Expandable Details */}
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>{expanded ? 'Hide' : 'Show'} Details</span>
                <svg 
                  className={`ml-1 w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expanded && (
                <div className="mt-4 space-y-6">
                  {/* Key Points */}
                  {summary.keyPoints.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Key Developments</h4>
                      <ul className="space-y-1">
                        {summary.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {summary.actionItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Action Items</h4>
                      <ul className="space-y-1">
                        {summary.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-orange-600 mr-2">→</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{summary.messageCount}</div>
                      <div className="text-sm text-gray-600">Messages Analyzed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{summary.squads.length}</div>
                      <div className="text-sm text-gray-600">Active Squads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Generated</div>
                      <div className="text-sm font-medium">{format(new Date(summary.createdAt), 'HH:mm')}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailySummary;
