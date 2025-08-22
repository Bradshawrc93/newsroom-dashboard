import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Message } from '../types';
import { messagesApi } from '../services/api';

interface ThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
  onDismiss?: (messageId: string) => void;
}

interface FormattedMessage extends Message {
  formattedText: string;
  slackPermalink?: string;
}

interface MessageDetails {
  message: FormattedMessage;
  threadedReplies: FormattedMessage[];
  tags: string[];
  actionItems: string[];
  importance: number;
}

const ThreadModal: React.FC<ThreadModalProps> = ({
  isOpen,
  onClose,
  message,
  onDismiss
}) => {
  const [messageDetails, setMessageDetails] = useState<MessageDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && message) {
      loadMessageDetails();
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

  const loadMessageDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading message details for:', message.id);
      const response = await messagesApi.getMessageDetails(message.id);
      
      if (response.success) {
        setMessageDetails(response.data);
        console.log('Message details loaded:', response.data);
      } else {
        throw new Error(response.error || 'Failed to load message details');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load message details';
      setError(errorMessage);
      console.error('Message details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const renderFormattedText = (text: string) => {
    // Convert markdown-style links to actual links
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${linkText}</a>`;
    });
  };

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
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading message details...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={loadMessageDetails}
                  className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            ) : messageDetails ? (
              <>
                {/* Main Message */}
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{messageDetails.message.userName}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(messageDetails.message.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                      {messageDetails.message.slackPermalink && (
                        <>
                          <span className="text-gray-500">•</span>
                          <a
                            href={messageDetails.message.slackPermalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            View in Slack
                          </a>
                        </>
                      )}
                    </div>
                    {messageDetails.message.reactions && messageDetails.message.reactions.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {messageDetails.message.reactions.map((reaction, index) => (
                          <span key={index} className="text-sm bg-gray-200 px-2 py-1 rounded-full">
                            {reaction.name} {reaction.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div 
                    className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: renderFormattedText(messageDetails.message.formattedText || messageDetails.message.text) 
                    }}
                  />
                </div>

                {/* Tags Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Tags & Classification</h3>
                  <div className="flex flex-wrap gap-2">
                    {messageDetails.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Importance Score: <span className="font-medium">{Math.round(messageDetails.importance * 100)}%</span>
                  </div>
                </div>

                {/* Action Items */}
                {messageDetails.actionItems.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
                    <ul className="space-y-2">
                      {messageDetails.actionItems.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-600 mr-2 mt-1">→</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Threaded Replies */}
                {messageDetails.threadedReplies.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Thread Replies ({messageDetails.threadedReplies.length})
                    </h3>
                    <div className="space-y-3 ml-4 border-l-2 border-gray-200 pl-4">
                      {messageDetails.threadedReplies.map((reply, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{reply.userName}</span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(reply.timestamp), 'MMM dd, HH:mm')}
                              </span>
                            </div>
                            {reply.slackPermalink && (
                              <a
                                href={reply.slackPermalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                View
                              </a>
                            )}
                          </div>
                          <div 
                            className="text-gray-700 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ 
                              __html: renderFormattedText(reply.formattedText || reply.text) 
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No message details available</p>
              </div>
            )}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadModal;
