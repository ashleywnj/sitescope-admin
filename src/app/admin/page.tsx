"use client";

// Disable static generation for this page since it uses Firebase
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from './contexts/AdminContext';
import AdminDashboard from './components/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';

export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/');
      } else if (!isAdmin) {
        // Logged in but not admin, redirect to protected area
        router.push('/protected');
      }
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to access this admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}