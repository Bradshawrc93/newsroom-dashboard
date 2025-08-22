import React, { useState, useEffect } from 'react';
import { 
  HashtagIcon, 
  UserIcon, 
  TagIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { squadApi, channelsApi, usersApi, tagsApi } from '../services/api';

interface Squad {
  id: string;
  name: string;
  description?: string;
  parentSquad?: string;
  channels: string[];
  people: string[];
  tags: string[];
}

interface SquadHierarchy {
  squad: Squad;
  subsquads: Squad[];
  channelCount: number;
  peopleCount: number;
  tagCount: number;
}

const SquadManager: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<SquadHierarchy[]>([]);
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);

  useEffect(() => {
    loadSquadData();
  }, []);

  const loadSquadData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [channelsResponse, usersResponse, tagsResponse] = await Promise.all([
        channelsApi.getChannels(),
        usersApi.getUsers(),
        tagsApi.getTags()
      ]);

      const channelsData = (channelsResponse as any)?.data?.channels || [];
      const usersData = (usersResponse as any)?.data?.users || [];
      const tagsData = (tagsResponse as any)?.data?.tags || [];

      setChannels(channelsData);
      setUsers(usersData);
      setTags(tagsData);

      // Build squad hierarchy from channels data
      const squadMap = new Map<string, Squad>();
      
      // Group channels by squad
      channelsData.forEach((channel: any) => {
        const squadName = channel.squad || 'general';
        if (!squadMap.has(squadName)) {
          squadMap.set(squadName, {
            id: squadName,
            name: squadName.charAt(0).toUpperCase() + squadName.slice(1),
            channels: [],
            people: [],
            tags: []
          });
        }
        squadMap.get(squadName)!.channels.push(channel.id);
      });

      // Group users by squad
      usersData.forEach((user: any) => {
        const squadName = user.squad || 'general';
        if (!squadMap.has(squadName)) {
          squadMap.set(squadName, {
            id: squadName,
            name: squadName.charAt(0).toUpperCase() + squadName.slice(1),
            channels: [],
            people: [],
            tags: []
          });
        }
        squadMap.get(squadName)!.people.push(user.id);
      });

      // Add tags to squads based on user common tags
      usersData.forEach((user: any) => {
        const squadName = user.squad || 'general';
        const squad = squadMap.get(squadName);
        if (squad && user.commonTags) {
          user.commonTags.forEach((tag: string) => {
            if (!squad.tags.includes(tag)) {
              squad.tags.push(tag);
            }
          });
        }
      });

      // Convert to hierarchy format
      const hierarchyData: SquadHierarchy[] = Array.from(squadMap.values()).map(squad => ({
        squad,
        subsquads: [], // For now, no subsquads in the data
        channelCount: squad.channels.length,
        peopleCount: squad.people.length,
        tagCount: squad.tags.length
      }));

      // Sort by name
      hierarchyData.sort((a, b) => a.squad.name.localeCompare(b.squad.name));

      setHierarchy(hierarchyData);
      setError(null);
    } catch (err) {
      console.error('Error loading squad data:', err);
      setError('Failed to load squad data. Please try again.');
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
    if (name.includes('portal')) return '🌐';
    if (name.includes('epic')) return '⚡';
    if (name.includes('deep')) return '🔍';
    return '🏢';
  };

  const getSquadColor = (squadName: string) => {
    const name = squadName.toLowerCase();
    if (name.includes('voice')) return 'bg-blue-100 text-blue-800';
    if (name.includes('rcm')) return 'bg-green-100 text-green-800';
    if (name.includes('hitl')) return 'bg-purple-100 text-purple-800';
    if (name.includes('customer')) return 'bg-yellow-100 text-yellow-800';
    if (name.includes('thoughthub')) return 'bg-indigo-100 text-indigo-800';
    if (name.includes('developer')) return 'bg-gray-100 text-gray-800';
    if (name.includes('data')) return 'bg-red-100 text-red-800';
    if (name.includes('portal')) return 'bg-cyan-100 text-cyan-800';
    if (name.includes('epic')) return 'bg-orange-100 text-orange-800';
    if (name.includes('deep')) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.name || channelId;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || userId;
  };

  const getTagName = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.name || tagId;
  };

  const handleEditSquad = (squad: Squad) => {
    setEditingSquad(squad);
    setShowEditModal(true);
  };

  const handleDeleteSquad = async (squadId: string) => {
    if (window.confirm('Are you sure you want to delete this squad?')) {
      try {
        await squadApi.removeSquad(squadId);
        await loadSquadData(); // Reload data after deletion
      } catch (err) {
        console.error('Failed to delete squad:', err);
        alert('Failed to delete squad. Please try again.');
      }
    }
  };

  const handleCreateSquad = async (squadData: { name: string; description?: string }) => {
    try {
      await squadApi.addSquad(squadData);
      setShowCreateModal(false);
      await loadSquadData(); // Reload data after creation
    } catch (err) {
      console.error('Failed to create squad:', err);
      alert('Failed to create squad. Please try again.');
    }
  };

  const handleUpdateSquad = async (squadId: string, squadData: { name: string; description?: string }) => {
    try {
      await squadApi.updateSquad(squadId, squadData);
      setShowEditModal(false);
      setEditingSquad(null);
      await loadSquadData(); // Reload data after update
    } catch (err) {
      console.error('Failed to update squad:', err);
      alert('Failed to update squad. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading squads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading squad data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button 
                onClick={loadSquadData}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Squad Management</h2>
          <p className="text-gray-600 mt-1">Manage your team squads, channels, and members</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Squad
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HashtagIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Squads</p>
              <p className="text-lg font-semibold text-gray-900">{hierarchy.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HashtagIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Channels</p>
              <p className="text-lg font-semibold text-gray-900">{channels.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-lg font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TagIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Tags</p>
              <p className="text-lg font-semibold text-gray-900">{tags.length}</p>
            </div>
          </div>
        </div>
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
                    <button 
                      onClick={() => handleEditSquad(item.squad)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSquad(item.squad.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedSquads.has(item.squad.id) && (
              <div className="p-4 space-y-4">
                {/* Channels */}
                {item.squad.channels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Channels</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.squad.channels.map((channelId) => {
                        const channel = channels.find(c => c.id === channelId);
                        return (
                          <div key={channelId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">#{getChannelName(channelId)}</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                channel?.isConnected 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {channel?.isConnected ? 'Connected' : 'Disconnected'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button className="p-1 text-gray-400 hover:text-gray-600">
                                <PencilSquareIcon className="h-3 w-3" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-red-600">
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* People */}
                {item.squad.people.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.squad.people.map((userId) => {
                        const user = users.find(u => u.id === userId);
                        return (
                          <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {getUserName(userId).charAt(0)}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{getUserName(userId)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button className="p-1 text-gray-400 hover:text-gray-600">
                                <PencilSquareIcon className="h-3 w-3" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-red-600">
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {item.squad.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.squad.tags.map((tagId) => (
                        <span key={tagId} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSquadColor(item.squad.name)}`}>
                          {getTagName(tagId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                  <button className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Channel
                  </button>
                  <button className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Person
                  </button>
                  <button className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Tag
                  </button>
                  {item.subsquads.length === 0 && (
                    <button className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md">
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

      {/* Create Squad Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Squad</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateSquad({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string
                });
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Squad Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Squad
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Squad Modal */}
      {showEditModal && editingSquad && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Squad</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateSquad(editingSquad.id, {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string
                });
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Squad Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingSquad.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingSquad.description}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSquad(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Squad
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SquadManager;
