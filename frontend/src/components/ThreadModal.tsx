import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Message } from '../types';
import { aiApi, learningApi } from '../services/api';

interface ThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
  onDismiss?: (messageId: string) => void;
}

interface AIAnalysis {
  tags: string[];
  importance: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

const ThreadModal: React.FC<ThreadModalProps> = ({
  isOpen,
  onClose,
  message,
  onDismiss
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [customImportance, setCustomImportance] = useState<number | null>(null);
  const [originalTags, setOriginalTags] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && message) {
      loadAIAnalysis();
    }
  }, [isOpen, message]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const loadAIAnalysis = async () => {
    setLoadingAnalysis(true);
    setAnalysisError(null);

    try {
      console.log('Loading AI analysis for message:', message.id);
      const response = await aiApi.analyzeMessage(message.id);
      
      if (response.success) {
        const analysis = response.data;
        const tags = analysis.tags || [];
        setAiAnalysis({
          tags,
          importance: analysis.importance || 0,
          urgencyLevel: analysis.urgencyLevel || 'low',
          confidence: analysis.confidence || 0
        });
        setOriginalTags([...tags]); // Store original tags for learning
        console.log('AI analysis loaded:', analysis);
      } else {
        throw new Error(response.error || 'Failed to analyze message');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load AI analysis';
      setAnalysisError(errorMessage);
      console.error('AI analysis error:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const addCustomTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags([...customTags, newTag.trim()]);
      setNewTag('');
      setHasChanges(true);
    }
  };

  const removeCustomTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
    setHasChanges(true);
  };

  const recordTagFeedback = async (feedback: 'positive' | 'negative') => {
    if (!aiAnalysis) return;

    try {
      await learningApi.recordTagFeedback({
        messageId: message.id,
        tags: aiAnalysis.tags,
        feedback
      });
      console.log('Tag feedback recorded:', feedback);
    } catch (error) {
      console.error('Failed to record tag feedback:', error);
    }
  };

  const saveChanges = async () => {
    if (!hasChanges || !aiAnalysis) return;

    try {
      const finalTags = [...aiAnalysis.tags, ...customTags];
      
      // Record tag correction if there are changes
      if (customTags.length > 0 || customImportance !== null) {
        await learningApi.recordTagCorrection({
          messageId: message.id,
          originalTags: originalTags,
          correctedTags: finalTags
        });
        console.log('Tag correction recorded');
      }

      // In a real app, you'd also save the changes to the message
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const getImportanceColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600 bg-red-100';
    if (score >= 0.6) return 'text-orange-600 bg-orange-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getImportanceLabel = (score: number) => {
    if (score >= 0.8) return 'Critical';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Medium';
    return 'Low';
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const allTags = [
    ...(aiAnalysis?.tags || []),
    ...customTags
  ].filter((tag, index, array) => array.indexOf(tag) === index);

  const displayImportance = customImportance !== null ? customImportance : (aiAnalysis?.importance || 0);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
            <span className="text-sm text-gray-500">#{message.channelName}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Message Content */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{message.userName}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(message.timestamp), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <span>👍</span>
                    <span>{message.reactions.reduce((sum, r) => sum + r.count, 0)} reactions</span>
                  </div>
                )}
              </div>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </div>

            {/* AI Analysis Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">AI Analysis</h3>
                <button
                  onClick={loadAIAnalysis}
                  disabled={loadingAnalysis}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingAnalysis ? 'Analyzing...' : 'Refresh Analysis'}
                </button>
              </div>

              {loadingAnalysis ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Analyzing message with AI...</span>
                </div>
              ) : analysisError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{analysisError}</p>
                  <button
                    onClick={loadAIAnalysis}
                    className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  {/* AI Tag Feedback */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      How accurate are these AI-generated tags?
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => recordTagFeedback('positive')}
                        className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                      >
                        👍 Good
                      </button>
                      <button
                        onClick={() => recordTagFeedback('negative')}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                      >
                        👎 Poor
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Importance Score */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Importance Score
                    </label>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getImportanceColor(displayImportance)}`}>
                      {getImportanceLabel(displayImportance)} ({Math.round(displayImportance * 100)}%)
                    </div>
                    <div className="mt-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={displayImportance}
                        onChange={(e) => {
                          setCustomImportance(parseFloat(e.target.value));
                          setHasChanges(true);
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Urgency Level */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Level
                    </label>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getUrgencyColor(aiAnalysis.urgencyLevel)}`}>
                      {aiAnalysis.urgencyLevel}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Confidence
                    </label>
                    <div className="text-lg font-semibold text-blue-600">
                      {Math.round(aiAnalysis.confidence * 100)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${aiAnalysis.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>AI analysis not available</p>
                  <button
                    onClick={loadAIAnalysis}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Analyze Message
                  </button>
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
              
              {/* Current Tags */}
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      customTags.includes(tag)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {tag}
                    {customTags.includes(tag) && (
                      <button
                        onClick={() => removeCustomTag(tag)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {allTags.length === 0 && (
                  <span className="text-gray-500 italic">No tags assigned</span>
                )}
              </div>

              {/* Add Custom Tag */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                  placeholder="Add custom tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addCustomTag}
                  disabled={!newTag.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            {onDismiss && (
              <button
                onClick={() => {
                  onDismiss(message.id);
                  onClose();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
              >
                Dismiss Message
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
            >
              Close
            </button>
            <button
              onClick={saveChanges}
              disabled={!hasChanges}
              className={`px-4 py-2 rounded-md transition-colors ${
                hasChanges 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadModal;
