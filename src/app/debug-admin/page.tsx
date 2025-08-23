"use client";

// Disable static generation for this page since it uses Firebase
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { checkIsAdmin } from '../admin/utils/adminAuth';
import ClientOnly from '../components/ClientOnly';
import Link from 'next/link';

function DebugAdminContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Get ID token with claims
          const idTokenResult = await currentUser.getIdTokenResult(true);
          setClaims(idTokenResult.claims);
          
          // Check admin status
          const adminStatus = await checkIsAdmin(currentUser);
          setIsAdmin(adminStatus);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } else {
        setIsAdmin(null);
        setClaims(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <p><strong>Logged in:</strong> {user ? 'Yes' : 'No'}</p>
          {user && (
            <>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Admin Status</h2>
          <p><strong>Is Admin:</strong> {isAdmin === null ? 'N/A' : isAdmin ? 'Yes' : 'No'}</p>
          {error && <p className="text-red-600"><strong>Error:</strong> {error}</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Token Claims</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
            {claims ? JSON.stringify(claims, null, 2) : 'No claims available'}
          </pre>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Instructions</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>If you&apos;re not logged in, go to <Link href="/" className="text-blue-600 underline">login page</Link></li>
            <li>If &quot;Is Admin&quot; shows &quot;No&quot;, you need to create admin privileges at <Link href="/setup-admin" className="text-blue-600 underline">/setup-admin</Link></li>
            <li>If &quot;Is Admin&quot; shows &quot;Yes&quot;, the admin link should appear in your user menu</li>
            <li>Look for the &quot;admin: true&quot; claim in the Token Claims section</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function DebugAdminPage() {
  return (
    <ClientOnly fallback={<div className="p-8">Loading debug page...</div>}>
      <DebugAdminContent />
    </ClientOnly>
  );
}