"use client";

import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebase';
import { useAdmin } from '../contexts/AdminContext';
import UserManagement from './UserManagement';
import AdminActions from './AdminActions';
import OrganizationManagement from './OrganizationManagement';
import Icon from '../../protected/components/Icon';

export default function AdminDashboard() {
  const { user } = useAdmin();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'actions' | 'organizations'>('users');

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/protected')}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors mr-4"
              >
                <Icon 
                  path="M19 12H5m14 0l-4-4m4 4l-4 4" 
                  className="w-4 h-4 mr-2"
                />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Super Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Logged in as: <span className="font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <Icon 
                  path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" 
                  className="w-4 h-4 mr-2"
                />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'actions'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Admin Actions
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'organizations'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Organization Management
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'actions' && <AdminActions />}
        {activeTab === 'organizations' && <OrganizationManagement />}
      </main>
    </div>
  );
}