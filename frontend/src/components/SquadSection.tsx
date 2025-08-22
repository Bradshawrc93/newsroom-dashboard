import React, { useState } from 'react';
import { Message } from '../types';
import MessageCard from './MessageCard';

interface SquadSectionProps {
  squadName: string;
  messages: Message[];
  onDismissMessage: (messageId: string) => void;
  initialShowCount?: number;
}

const SquadSection: React.FC<SquadSectionProps> = ({
  squadName,
  messages,
  onDismissMessage,
  initialShowCount = 5
}) => {
  const [showAll, setShowAll] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const displayMessages = showAll ? messages : messages.slice(0, initialShowCount);
  const hasMoreMessages = messages.length > initialShowCount;

  const getSquadColor = (squadName: string) => {
    const colors = {
      'Core RCM': 'bg-blue-500',
      'Voice AI': 'bg-purple-500', 
      'HITL': 'bg-green-500',
      'Portal Aggregator': 'bg-orange-500',
      'ThoughtHub': 'bg-pink-500',
      'Nox Health': 'bg-red-500',
      'OrthoFi': 'bg-indigo-500',
      'BioWound': 'bg-teal-500',
      'Legent': 'bg-cyan-500',
      'General': 'bg-gray-500'
    };
    return colors[squadName as keyof typeof colors] || 'bg-gray-500';
  };

  const getSquadDescription = (squadName: string) => {
    const descriptions = {
      'Core RCM': 'Revenue Cycle Management and Epic integrations',
      'Voice AI': 'Voice AI technology and conversation processing',
      'HITL': 'Human-in-the-Loop workflow optimization',
      'Portal Aggregator': 'Data aggregation and portal management',
      'ThoughtHub': 'Knowledge management and documentation',
      'Nox Health': 'Nox Health partnership and integration',
      'OrthoFi': 'OrthoFi partnership and integration',
      'BioWound': 'BioWound partnership and integration',
      'Legent': 'Legent partnership and integration',
      'General': 'General product and engineering discussions'
    };
    return descriptions[squadName as keyof typeof descriptions] || 'Team discussions and updates';
  };

  if (messages.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Squad Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
            >
              {/* Squad Color Indicator */}
              <div className={`w-4 h-4 rounded-full ${getSquadColor(squadName)}`}></div>
              
              {/* Squad Name and Info */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  {squadName}
                  <svg 
                    className={`ml-2 w-5 h-5 text-gray-500 transition-transform ${collapsed ? '-rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </h2>
                <p className="text-sm text-gray-600">{getSquadDescription(squadName)}</p>
              </div>
            </button>
          </div>

          {/* Message Count and Actions */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{messages.length}</span> messages
            </div>
            
            {!collapsed && hasMoreMessages && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAll ? 'Show Less' : `Show All (${messages.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {!collapsed && (
        <div className="p-6">
          {displayMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No messages to display
            </div>
          ) : (
            <div className="space-y-4">
              {displayMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onDismiss={onDismissMessage}
                  showImportanceScore={false} // Will be enabled when AI analysis is integrated
                />
              ))}

              {/* Show More/Less Button */}
              {hasMoreMessages && !showAll && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowAll(true)}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Show {messages.length - initialShowCount} more messages
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SquadSection;
