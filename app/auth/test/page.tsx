'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  isAuthenticated,
  getStoredAccessToken,
  getStoredRefreshToken,
  clearTokens,
  refreshAccessToken,
  getUserInfoFromToken,
} from '../../../components/lib/auth';
import { redirectToLogin, LOGIN_URL } from '../../../components/lib/redirect';
import { fetchJobStatuses } from '../../../components/lib/crm-graphql';

interface TestResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown> | unknown[];
}

export default function AuthTestPage() {
  const [authStatus, setAuthStatus] = useState<boolean>(false);
  const [tokens, setTokens] = useState<{ access: string | null; refresh: string | null }>({
    access: null,
    refresh: null,
  });
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkAuth = () => {
    const authenticated = isAuthenticated();
    const accessToken = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();
    const info = getUserInfoFromToken();

    setAuthStatus(authenticated);
    setTokens({ access: accessToken, refresh: refreshToken });
    setUserInfo(info);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleClearTokens = () => {
    clearTokens();
    setAuthStatus(false);
    setTokens({ access: null, refresh: null });
    setUserInfo(null);
    setTestResult({ success: true, message: 'Tokens cleared successfully!' });
  };

  const handleRedirect = () => {
    redirectToLogin();
  };

  const handleRefreshToken = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        setTestResult({
          success: true,
          message: 'Token refreshed successfully!',
          data: { newToken: newToken.substring(0, 50) + '...' },
        });
        checkAuth();
      } else {
        setTestResult({ success: false, message: 'Failed to refresh token - no token returned' });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAPI = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const statuses = await fetchJobStatuses();
      setTestResult({
        success: true,
        message: `API call successful! Found ${statuses.length} job statuses.`,
        data: statuses,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const truncateToken = (token: string | null, length = 80): string => {
    if (!token) return 'No token';
    return token.length > length ? token.substring(0, length) + '...' : token;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Image src="/flow-logo.png" alt="FlowCRM" width={48} height={48} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FlowCRM Auth Test</h1>
            <p className="text-gray-600">Test authentication flow from FlowRMS</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Authentication Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
            <div className="flex items-center gap-4">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  authStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {authStatus ? '✓ Authenticated' : '✗ Not Authenticated'}
              </span>
              <span className="text-sm text-gray-500">
                Login URL: <code className="bg-gray-100 px-2 py-1 rounded">{LOGIN_URL}</code>
              </span>
            </div>
          </div>

          {/* User Info */}
          {userInfo && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">User Info (from JWT)</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Username:</span>
                  <span className="ml-2 font-medium">{String(userInfo.username || 'N/A')}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 font-medium">{String(userInfo.email || 'N/A')}</span>
                </div>
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium">{String(userInfo.name || 'N/A')}</span>
                </div>
                <div>
                  <span className="text-gray-500">Expires:</span>
                  <span className="ml-2 font-medium">
                    {userInfo.exp
                      ? new Date((userInfo.exp as number) * 1000).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Token Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Token Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token:
                </label>
                <div className="bg-gray-50 p-3 rounded border text-xs font-mono break-all text-gray-600">
                  {truncateToken(tokens.access)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Token:
                </label>
                <div className="bg-gray-50 p-3 rounded border text-xs font-mono break-all text-gray-600">
                  {truncateToken(tokens.refresh)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleTestAPI}
                disabled={isLoading || !authStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Testing...' : 'Test API Call'}
              </button>
              <button
                onClick={handleRefreshToken}
                disabled={isLoading || !tokens.refresh}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Refreshing...' : 'Test Token Refresh'}
              </button>
              <button
                onClick={handleClearTokens}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Tokens
              </button>
              <button
                onClick={handleRedirect}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Redirect to FlowRMS
              </button>
              <button
                onClick={() => {
                  checkAuth();
                  setTestResult({ success: true, message: 'Page refreshed!' });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refresh Status
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  testResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {testResult.message}
                </p>
                {testResult.data && (
                  <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Test Form (Simulate FlowRMS) */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Simulate FlowRMS Redirect</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use this form to simulate what FlowRMS does when redirecting to FlowCRM. Enter tokens
              and submit to test the full flow.
            </p>
            <form action="/api/auth/receive-token" method="POST" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token:
                </label>
                <textarea
                  name="access_token"
                  rows={3}
                  placeholder="Paste a valid JWT access token here..."
                  className="w-full p-2 border rounded text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Token:
                </label>
                <textarea
                  name="refresh_token"
                  rows={2}
                  placeholder="Paste a valid refresh token here..."
                  className="w-full p-2 border rounded text-sm font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Submit Tokens (Simulate FlowRMS)
              </button>
            </form>
          </div>

          {/* Integration Info */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              Integration URLs for FlowRMS Team
            </h2>
            <div className="space-y-2 text-sm text-blue-800">
              <p>
                <strong>Token Receive Endpoint:</strong>{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/api/auth/receive-token`
                    : '/api/auth/receive-token'}
                </code>
              </p>
              <p>
                <strong>Method:</strong> POST (form data)
              </p>
              <p>
                <strong>Required Fields:</strong> <code>access_token</code>,{' '}
                <code>refresh_token</code>
              </p>
              <p>
                <strong>Token Refresh API:</strong>{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">
                  https://py.report.flowrms.com/api/auth/refresh
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
