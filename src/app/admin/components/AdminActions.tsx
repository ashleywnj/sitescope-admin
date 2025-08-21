"use client";

import { useState } from 'react';
import { addAdminRole, removeAdminRole } from '../utils/adminAuth';
import { useAdmin } from '../contexts/AdminContext';
import Icon from '../../protected/components/Icon';

export default function AdminActions() {
  const { refreshAdminStatus } = useAdmin();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setMessage(null);
      
      const result = await addAdminRole(email.trim());
      setMessage({ type: 'success', text: result.message });
      setEmail('');
      
      // Refresh admin status in case we just made ourselves admin
      await refreshAdminStatus();
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err?.message || 'Failed to add admin role' 
      });
      console.error('Error adding admin role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Confirm before removing admin role
    if (!window.confirm(`Are you sure you want to remove admin role from ${email.trim()}?`)) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      const result = await removeAdminRole(email.trim());
      setMessage({ type: 'success', text: result.message });
      setEmail('');
      
      // Refresh admin status in case we just removed our own admin role
      await refreshAdminStatus();
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err?.message || 'Failed to remove admin role' 
      });
      console.error('Error removing admin role:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Admin Role Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Grant or revoke admin privileges for users
          </p>
        </div>
        
        <div className="px-6 py-4">
          <form className="space-y-4">
            <div>
              <label 
                htmlFor="admin-email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                User Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user email address..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
            </div>

            {message && (
              <div className={`p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start">
                  <Icon 
                    path={message.type === 'success' 
                      ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      : "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    }
                    className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleAddAdmin}
                disabled={loading || !email.trim()}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Icon path="M12 4.5v15m7.5-7.5h-15" className="w-4 h-4 mr-2" />
                )}
                Grant Admin Role
              </button>
              
              <button
                type="button"
                onClick={handleRemoveAdmin}
                disabled={loading || !email.trim()}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Icon path="M19.5 12h-15" className="w-4 h-4 mr-2" />
                )}
                Revoke Admin Role
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <Icon 
            path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
            className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0"
          />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Important Security Notes
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <ul className="list-disc pl-5 space-y-1">
                <li>Admin privileges grant full access to all users and data across all organizations</li>
                <li>Only grant admin access to trusted users who require system-wide management capabilities</li>
                <li>Changes to admin roles may take a few minutes to propagate</li>
                <li>Users may need to sign out and sign back in for admin role changes to take effect</li>
                <li>Be careful when revoking your own admin role - you may lose access to this dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <Icon 
            path="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l3.5-1.75a.75.75 0 000-1.342L11.25 11.25M12 9.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z" 
            className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
          />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Setting up the first admin
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                To set up the very first admin user, you'll need to deploy the Cloud Functions and then 
                temporarily modify the <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">addAdminRole</code> function 
                to bypass the admin check for the initial setup. See the documentation for detailed steps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}