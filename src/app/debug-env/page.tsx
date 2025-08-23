"use client";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function DebugEnvPage() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Environment Info</h2>
          <p><strong>Host:</strong> {typeof window !== 'undefined' ? window.location.host : 'Server-side'}</p>
          <p><strong>Protocol:</strong> {typeof window !== 'undefined' ? window.location.protocol : 'Server-side'}</p>
          <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 100) + '...' : 'Server-side'}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Firebase Configuration</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto whitespace-pre-wrap">
            {JSON.stringify(firebaseConfig, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Debug Instructions</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Check if all Firebase config values are present (not undefined)</li>
            <li>Verify this domain is in Firebase Auth authorized domains</li>
            <li>Open browser console to check for Firebase errors</li>
            <li><strong>Delete this debug page after troubleshooting</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}