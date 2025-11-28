'use client';

import React, { useState, useEffect } from 'react';
import {
  getCRMTokens,
  setCRMTokens,
  clearCRMTokens,
  hasCRMTokens,
  getAuthMode,
  checkTokenServerHealth,
  type AuthMode,
} from './lib/crm-auth';
import {
  getTokenServerConfig,
  setTokenServerConfig,
  clearTokenServerConfig,
  tokenServerClient,
} from './lib/crm-token-server';
import { fetchJobStatuses } from './lib/crm-graphql';

export default function CRMAuthContent() {
  // Manual token state
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  // Token Server state
  const [serverUrl, setServerUrl] = useState('http://127.0.0.1:8000');
  const [tenant, setTenant] = useState('staging2');
  const [env, setEnv] = useState('staging');
  const [tokenServerEnabled, setTokenServerEnabled] = useState(false);

  // General state
  const [authMode, setAuthMode] = useState<AuthMode>('manual');
  const [isConnected, setIsConnected] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ healthy: boolean; message: string } | null>(null);

  // Load existing configuration on mount
  useEffect(() => {
    const tokens = getCRMTokens();
    if (tokens.accessToken) setAccessToken(tokens.accessToken);
    if (tokens.refreshToken) setRefreshToken(tokens.refreshToken);

    const config = getTokenServerConfig();
    setServerUrl(config.serverUrl);
    setTenant(config.tenant);
    setEnv(config.env);
    setTokenServerEnabled(config.enabled);

    setAuthMode(getAuthMode());
    setIsConnected(hasCRMTokens());
  }, []);

  // Save manual tokens
  const handleSaveManualTokens = () => {
    if (!accessToken || !refreshToken) {
      setTestResult({ success: false, message: 'Both access token and refresh token are required' });
      return;
    }

    setCRMTokens(accessToken, refreshToken);
    setTokenServerEnabled(false);
    setTokenServerConfig({ enabled: false });
    setAuthMode('manual');
    setIsConnected(true);
    setTestResult({ success: true, message: 'Tokens saved successfully!' });
  };

  // Save Token Server configuration
  const handleSaveTokenServer = () => {
    if (!serverUrl || !tenant) {
      setTestResult({ success: false, message: 'Server URL and Tenant are required' });
      return;
    }

    setTokenServerConfig({
      serverUrl,
      tenant,
      env,
      enabled: true,
    });
    setTokenServerEnabled(true);
    tokenServerClient.clearCache();
    setAuthMode('token-server');
    setIsConnected(true);
    setTestResult({ success: true, message: 'Token Server configuration saved!' });
  };

  // Clear all tokens
  const handleClearTokens = () => {
    clearCRMTokens();
    clearTokenServerConfig();
    setAccessToken('');
    setRefreshToken('');
    setTokenServerEnabled(false);
    setAuthMode('manual');
    setIsConnected(false);
    setTestResult(null);
    setHealthStatus(null);
    tokenServerClient.clearCache();
  };

  // Test API connection
  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const statuses = await fetchJobStatuses();
      setTestResult({
        success: true,
        message: `Connection successful! Found ${statuses.length} job statuses.`,
      });
      setIsConnected(true);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check Token Server health
  const handleCheckHealth = async () => {
    setIsLoading(true);
    setHealthStatus(null);

    const result = await checkTokenServerHealth();
    setHealthStatus(result);
    setIsLoading(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">CRM API Configuration</h1>
          <p className="text-[var(--muted-foreground)]">
            Configure your authentication tokens to connect to the FlowCRM GraphQL API.
          </p>
        </div>

        {/* Connection Status */}
        <div className={`rounded-lg p-4 mb-6 ${
          isConnected 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <div>
              <h3 className={`font-medium ${isConnected ? 'text-green-800' : 'text-yellow-800'}`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </h3>
              <p className={`text-sm ${isConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                {isConnected 
                  ? `Using ${authMode === 'token-server' ? 'Token Server' : 'Manual Tokens'} authentication`
                  : 'Configure your tokens below to connect to the CRM API'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setAuthMode('manual')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                authMode === 'manual'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Manual Tokens
            </button>
            <button
              onClick={() => setAuthMode('token-server')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                authMode === 'token-server'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Token Server
            </button>
          </div>
        </div>

        {/* Manual Tokens Form */}
        {authMode === 'manual' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Manual Token Entry</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Enter your access and refresh tokens manually. You can obtain these from your CRM account settings.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Access Token
                </label>
                <textarea
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Paste your access token here..."
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-mono bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Refresh Token
                </label>
                <textarea
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  placeholder="Paste your refresh token here..."
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-mono bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveManualTokens}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Save Tokens
                </button>
                <button
                  onClick={handleClearTokens}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Token Server Form */}
        {authMode === 'token-server' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Token Server Configuration</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Connect to a local Token Server for automatic token management and refresh.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Server URL
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://127.0.0.1:8000"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Tenant
                  </label>
                  <input
                    type="text"
                    value={tenant}
                    onChange={(e) => setTenant(e.target.value)}
                    placeholder="staging2"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Environment
                  </label>
                  <select
                    value={env}
                    onChange={(e) => setEnv(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveTokenServer}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Save Configuration
                </button>
                <button
                  onClick={handleCheckHealth}
                  disabled={isLoading}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Checking...' : 'Check Health'}
                </button>
                <button
                  onClick={handleClearTokens}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Health Status */}
              {healthStatus && (
                <div className={`mt-4 p-3 rounded-lg ${
                  healthStatus.healthy 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${healthStatus.healthy ? 'text-green-700' : 'text-red-700'}`}>
                    {healthStatus.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Connection */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Test Connection</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Verify your configuration by testing the connection to the CRM API.
          </p>

          <button
            onClick={handleTestConnection}
            disabled={isLoading || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test API Connection'}
          </button>

          {testResult && (
            <div className={`mt-4 p-3 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>

        {/* API Endpoint Info */}
        <div className="mt-6 p-4 bg-[var(--muted)]/30 rounded-lg">
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">API Endpoint</h3>
          <code className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
            {process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL || 'Not configured'}
          </code>
        </div>
      </div>
    </main>
  );
}
