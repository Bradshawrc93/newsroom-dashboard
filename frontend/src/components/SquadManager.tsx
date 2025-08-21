import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  HashtagIcon, 
  UserIcon, 
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { squadApi } from '../services/api';

interface SquadHierarchy {
  squad: {
    id: string;
    name: string;
    description?: string;
    parentSquad?: string;
  };
  subsquads: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  channelCount: number;
  peopleCount: number;
  tagCount: number;
}

const SquadManager: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<SquadHierarchy[]>([]);
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSquadHierarchy();
  }, []);

  const loadSquadHierarchy = async () => {
    try {
      setLoading(true);
      const response = await squadApi.getHierarchy();
      setHierarchy(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load squad hierarchy');
      console.error('Error loading squad hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSquadExpansion = (squadId: string) => {
    const newExpanded = new Set(expandedSquads);
    if (newExpanded.has(squadId)) {
      newExpanded.delete(squadId);
    } else {
      newExpanded.add(squadId);
    }
    setExpandedSquads(newExpanded);
  };

  const getSquadIcon = (squadName: string) => {
    const name = squadName.toLowerCase();
    if (name.includes('voice')) return '🎤';
    if (name.includes('rcm')) return '💰';
    if (name.includes('hitl')) return '👥';
    if (name.includes('customer')) return '👤';
    if (name.includes('thoughthub')) return '💭';
    if (name.includes('developer')) return '⚙️';
    if (name.includes('data')) return '📊';
    if (name.includes('medical')) return '🏥';
    if (name.includes('research')) return '🔬';
    return '🏢';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading squads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadSquadHierarchy}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Squad Management</h2>
        <p className="text-gray-600 mt-1">Manage your team squads, channels, and members</p>
      </div>

      <div className="space-y-4">
        {hierarchy.map((item) => (
          <div key={item.squad.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Main Squad Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleSquadExpansion(item.squad.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedSquads.has(item.squad.id) ? (
                      <ChevronDownIcon className="h-5 w-5" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5" />
                    )}
                  </button>
                  
                  <span className="text-2xl">{getSquadIcon(item.squad.name)}</span>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.squad.name}</h3>
                    {item.squad.description && (
                      <p className="text-sm text-gray-600">{item.squad.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <HashtagIcon className="h-4 w-4" />
                    <span>{item.channelCount}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <UserIcon className="h-4 w-4" />
                    <span>{item.peopleCount}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <TagIcon className="h-4 w-4" />
                    <span>{item.tagCount}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedSquads.has(item.squad.id) && (
              <div className="p-4 space-y-4">
                {/* Subsquads */}
                {item.subsquads.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Subsquads</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.subsquads.map((subsquad) => (
                        <div key={subsquad.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{subsquad.name}</span>
                            {subsquad.description && (
                              <p className="text-xs text-gray-600">{subsquad.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-600">
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                  <button className="inline-flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-md">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Channel
                  </button>
                  <button className="inline-flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-md">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Person
                  </button>
                  <button className="inline-flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-md">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Tag
                  </button>
                  {item.subsquads.length === 0 && (
                    <button className="inline-flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-md">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Subsquad
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Squad Button */}
      <div className="mt-6">
        <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Squad
        </button>
      </div>
    </div>
  );
};

export default SquadManager;
