import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  EnvelopeIcon, 
  HashtagIcon,
  TagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { usersApi, channelsApi, tagsApi } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  squad: string;
  commonTags: string[];
  createdAt: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSquad, setSelectedSquad] = useState('');
  const [squads, setSquads] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedSquad]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers();
      const usersData = (response as any)?.data?.users || [];
      setUsers(usersData);
      
      // Extract unique squads
      const uniqueSquads = [...new Set(usersData.map((user: User) => user.squad))].sort();
      setSquads(uniqueSquads);
      
      setError(null);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.squad.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by squad
    if (selectedSquad) {
      filtered = filtered.filter(user => user.squad === selectedSquad);
    }

    setFilteredUsers(filtered);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadUsers}
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
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <p className="text-gray-600 mt-1">Manage team members and their associations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-6 w-6 text-blue-600" />
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
              <HashtagIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Squads</p>
              <p className="text-lg font-semibold text-gray-900">{squads.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TagIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Tags per User</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.length > 0 
                  ? Math.round(users.reduce((acc, user) => acc + user.commonTags.length, 0) / users.length)
                  : 0
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or squad..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Squad
            </label>
            <select
              value={selectedSquad}
              onChange={(e) => setSelectedSquad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Squads</option>
              {squads.map(squad => (
                <option key={squad} value={squad}>
                  {squad.charAt(0).toUpperCase() + squad.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSquad('');
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Team Members ({filteredUsers.length})
            </h3>
            <button className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add User
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <div key={user.id} className="px-4 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {getUserInitials(user.name)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {user.email && (
                        <div className="flex items-center text-xs text-gray-500">
                          <EnvelopeIcon className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSquadColor(user.squad)}`}>
                        {user.squad.charAt(0).toUpperCase() + user.squad.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {user.commonTags.slice(0, 3).map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                    {user.commonTags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{user.commonTags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="px-4 py-8 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || selectedSquad 
                ? 'Try adjusting your search or filter criteria.'
                : 'No users have been added yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
