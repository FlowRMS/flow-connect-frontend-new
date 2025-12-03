'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { redirectToLogin } from '../../../components/lib/redirect';

export default function AuthBridge() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');

  useEffect(() => {
    const checkTokens = () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (accessToken && refreshToken) {
          setStatus('success');
          // Redirect to dashboard (main page)
          router.replace('/');
        } else {
          setStatus('failed');
          // Redirect to external app if tokens are missing
          redirectToLogin();
        }
      } catch (error) {
        console.error('Error checking tokens:', error);
        setStatus('failed');
        redirectToLogin();
      }
    };

    // Small delay to ensure localStorage is accessible
    const timer = setTimeout(checkTokens, 100);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          {status === 'checking' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
              <p className="text-gray-600">Please wait while we verify your authentication.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication successful!</h2>
              <p className="text-gray-600">Redirecting you to the dashboard...</p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication failed</h2>
              <p className="text-gray-600">Redirecting you to the login page...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
