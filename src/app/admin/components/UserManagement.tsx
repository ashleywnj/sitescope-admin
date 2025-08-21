"use client";

import { useState, useEffect } from 'react';
import { listAllUsers, setUserDisabled, getUserByEmail } from '../utils/adminAuth';
import Icon from '../../protected/components/Icon';

interface User {
  uid: string;
  email?: string;
  emailVerified: boolean;
  disabled: boolean;
  customClaims?: Record<string, unknown>;
  metadata: {
    creationTime: string;
    lastSignInTime?: string;
  };
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listAllUsers(100); // Load first 100 users
      setUsers(result.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    try {
      setSearchLoading(true);
      setSearchResult(null);
      const user = await getUserByEmail(searchEmail.trim());
      setSearchResult(user);
    } catch (err) {
      console.error('Error searching user:', err);
      setSearchResult(null);
      setError('User not found or error occurred during search');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleUserStatus = async (uid: string, currentDisabled: boolean) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(uid));
      await setUserDisabled(uid, !currentDisabled);
      
      // Update the user in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === uid 
            ? { ...user, disabled: !currentDisabled }
            : user
        )
      );

      // Update search result if it matches
      if (searchResult?.uid === uid) {
        setSearchResult(prev => 
          prev ? { ...prev, disabled: !currentDisabled } : prev
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
      console.error('Error updating user status:', err);
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(uid);
        return newSet;
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const UserRow = ({ user }: { user: User }) => {
    const isUpdating = updatingUsers.has(user.uid);
    const isAdmin = user.customClaims?.admin === true;

    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.email || 'No email'}
            </div>
            {user.emailVerified && (
              <Icon 
                path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                className="w-4 h-4 text-green-500 ml-2"
              />
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {user.uid}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              user.disabled 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            }`}>
              {user.disabled ? 'Disabled' : 'Active'}
            </span>
            {isAdmin && (
              <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                Admin
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {new Date(user.metadata.creationTime).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {user.metadata.lastSignInTime 
            ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
            : 'Never'
          }
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => handleToggleUserStatus(user.uid, user.disabled)}
            disabled={isUpdating}
            className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md transition-colors ${
              user.disabled
                ? 'text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-400 dark:bg-green-900 dark:hover:bg-green-800'
                : 'text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-900 dark:hover:bg-red-800'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
            ) : null}
            {user.disabled ? 'Enable' : 'Disable'}
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            User Search
          </h2>
          <form onSubmit={handleSearch} className="mt-4 flex gap-4">
            <div className="flex-1">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Enter user email to search..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading || !searchEmail.trim()}
              className="px-4 py-2 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {searchLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-4 h-4 mr-2" />
              )}
              Search
            </button>
          </form>
          
          {searchResult && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Search Result:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">UID</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Sign In</th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <UserRow user={searchResult} />
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              All Users
            </h2>
            <button
              onClick={loadUsers}
              disabled={loading}
              className="px-4 py-2 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Icon path="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" className="w-4 h-4 mr-2" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900 border-b border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    UID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Sign In
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <UserRow key={user.uid} user={user} />
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && !loading && (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}