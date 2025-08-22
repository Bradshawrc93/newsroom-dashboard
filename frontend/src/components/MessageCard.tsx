import React, { useState } from 'react';
import { format } from 'date-fns';
import { Message } from '../types';
import ThreadModal from './ThreadModal';

interface MessageCardProps {
  message: Message;
  onDismiss?: (messageId: string) => void;
  onExpand?: (messageId: string) => void;
  isDismissed?: boolean;
  dismissButtonText?: string;
  showImportanceScore?: boolean;
  tags?: string[];
  importance?: number;
}

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  onDismiss,
  onExpand,
  isDismissed = false,
  dismissButtonText = 'Dismiss',
  showImportanceScore = false,
  tags = [],
  importance = 0
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);

  const handleExpand = () => {
    if (onExpand) {
      onExpand(message.id);
    } else {
      setExpanded(!expanded);
    }
  };

  const getImportanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 0.6) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getImportanceLabel = (score: number) => {
    if (score >= 0.8) return 'Critical';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Medium';
    return 'Low';
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const hasReactions = message.reactions && message.reactions.length > 0;
  const reactionCount = hasReactions 
    ? message.reactions!.reduce((sum, r) => sum + r.count, 0)
    : 0;

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 ${
      isDismissed 
        ? 'bg-gray-50 border-gray-200 opacity-75' 
        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
    }`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {message.userName}
            </span>
            <span className="text-sm text-gray-500">
              in #{message.channelName}
            </span>
          </div>
          
          {/* Importance Score */}
          {showImportanceScore && importance > 0 && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getImportanceColor(importance)}`}>
              {getImportanceLabel(importance)} ({Math.round(importance * 100)}%)
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {format(new Date(message.timestamp), 'MMM dd, HH:mm')}
          </span>
          
          {/* Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowThreadModal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
            >
              Details
            </button>
            
            {message.text.length > 200 && (
              <button
                onClick={handleExpand}
                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
              >
                {expanded ? 'Less' : 'More'}
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={() => onDismiss(message.id)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isDismissed
                    ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {dismissButtonText}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div className="mb-3">
        <p className="text-gray-800 leading-relaxed">
          {expanded ? message.text : truncateText(message.text)}
        </p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          {/* Reactions */}
          {hasReactions && (
            <div className="flex items-center space-x-1">
              <span>👍</span>
              <span>{reactionCount} reactions</span>
            </div>
          )}
          
          {/* Thread indicator (placeholder) */}
          {(message as any).threadId && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Thread</span>
            </div>
          )}
        </div>

        {/* Message ID for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs font-mono text-gray-400">
            {message.id.split('.').pop()}
          </span>
        )}
      </div>

      {/* Thread Modal */}
      <ThreadModal
        isOpen={showThreadModal}
        onClose={() => setShowThreadModal(false)}
        message={message}
        onDismiss={onDismiss}
      />
    </div>
  );
};

export default MessageCard;
