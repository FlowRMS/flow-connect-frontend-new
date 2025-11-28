/**
 * FlowCRM Token Server Client
 * Integrates with the Token Server running on http://127.0.0.1:8000
 * Provides automatic token management with caching and refresh
 */

// Configuration defaults
const DEFAULT_TOKEN_SERVER_URL = 'http://127.0.0.1:8000';
const DEFAULT_TENANT = 'staging2';
const DEFAULT_ENV = 'staging';

// localStorage keys
const TOKEN_SERVER_URL_KEY = 'flowcrm_token_server_url';
const TOKEN_SERVER_TENANT_KEY = 'flowcrm_token_server_tenant';
const TOKEN_SERVER_ENV_KEY = 'flowcrm_token_server_env';
const TOKEN_SERVER_ENABLED_KEY = 'flowcrm_token_server_enabled';

export interface TokenServerResponse {
  access_token: string;
  refresh_token: string;
  authorization: string;
}

export interface TokenServerConfig {
  serverUrl: string;
  tenant: string;
  env: string;
  enabled: boolean;
}

export interface TokenServerHealthResponse {
  status: string;
  cached_tokens: number;
  timestamp?: string;
}

/**
 * Get Token Server configuration from localStorage
 */
export function getTokenServerConfig(): TokenServerConfig {
  if (typeof window === 'undefined') {
    return {
      serverUrl: DEFAULT_TOKEN_SERVER_URL,
      tenant: DEFAULT_TENANT,
      env: DEFAULT_ENV,
      enabled: false,
    };
  }

  return {
    serverUrl: localStorage.getItem(TOKEN_SERVER_URL_KEY) || DEFAULT_TOKEN_SERVER_URL,
    tenant: localStorage.getItem(TOKEN_SERVER_TENANT_KEY) || DEFAULT_TENANT,
    env: localStorage.getItem(TOKEN_SERVER_ENV_KEY) || DEFAULT_ENV,
    enabled: localStorage.getItem(TOKEN_SERVER_ENABLED_KEY) === 'true',
  };
}

/**
 * Save Token Server configuration to localStorage
 */
export function setTokenServerConfig(config: Partial<TokenServerConfig>): void {
  if (typeof window === 'undefined') return;

  if (config.serverUrl !== undefined) {
    localStorage.setItem(TOKEN_SERVER_URL_KEY, config.serverUrl);
  }
  if (config.tenant !== undefined) {
    localStorage.setItem(TOKEN_SERVER_TENANT_KEY, config.tenant);
  }
  if (config.env !== undefined) {
    localStorage.setItem(TOKEN_SERVER_ENV_KEY, config.env);
  }
  if (config.enabled !== undefined) {
    localStorage.setItem(TOKEN_SERVER_ENABLED_KEY, config.enabled.toString());
  }
}

/**
 * Clear Token Server configuration from localStorage
 */
export function clearTokenServerConfig(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_SERVER_URL_KEY);
  localStorage.removeItem(TOKEN_SERVER_TENANT_KEY);
  localStorage.removeItem(TOKEN_SERVER_ENV_KEY);
  localStorage.removeItem(TOKEN_SERVER_ENABLED_KEY);
}

/**
 * Check if Token Server is enabled
 */
export function isTokenServerEnabled(): boolean {
  return getTokenServerConfig().enabled;
}

/**
 * Token Server client class with caching and auto-refresh
 */
class TokenServerClient {
  private currentToken: TokenServerResponse | null = null;
  private lastFetchTime: number = 0;
  private readonly TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get token from Token Server with caching
   */
  async getToken(forceRefresh = false): Promise<TokenServerResponse> {
    const config = getTokenServerConfig();

    if (!config.enabled) {
      throw new Error('Token Server is not enabled. Enable it in FlowCRM settings.');
    }

    // Return cached token if still valid
    const now = Date.now();
    if (!forceRefresh && this.currentToken && now - this.lastFetchTime < this.TOKEN_CACHE_DURATION) {
      return this.currentToken;
    }

    const params = new URLSearchParams({
      tenant: config.tenant,
      env: config.env,
      force_refresh: forceRefresh.toString(),
    });

    try {
      const response = await fetch(`${config.serverUrl}/token?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      this.currentToken = await response.json();
      this.lastFetchTime = now;

      return this.currentToken as TokenServerResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error(`Cannot connect to Token Server at ${config.serverUrl}. Is it running?`);
        }
        throw error;
      }
      throw new Error('Failed to get token from Token Server');
    }
  }

  /**
   * Force refresh the token
   */
  async forceRefresh(): Promise<TokenServerResponse> {
    const config = getTokenServerConfig();

    if (!config.enabled) {
      throw new Error('Token Server is not enabled');
    }

    const params = new URLSearchParams({
      tenant: config.tenant,
      env: config.env,
    });

    try {
      const response = await fetch(`${config.serverUrl}/token/refresh?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      this.currentToken = await response.json();
      this.lastFetchTime = Date.now();

      return this.currentToken as TokenServerResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Get authorization header for API calls
   */
  async getAuthorizationHeader(forceRefresh = false): Promise<string> {
    const token = await this.getToken(forceRefresh);
    return token.authorization;
  }

  /**
   * Get just the access token
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    const token = await this.getToken(forceRefresh);
    return token.access_token;
  }

  /**
   * Clear cached token (useful when switching tenants/envs)
   */
  clearCache(): void {
    this.currentToken = null;
    this.lastFetchTime = 0;
  }

  /**
   * Check if Token Server is healthy
   */
  async checkHealth(): Promise<TokenServerHealthResponse> {
    const config = getTokenServerConfig();

    try {
      const response = await fetch(`${config.serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error(`Cannot connect to Token Server at ${config.serverUrl}`);
        }
        throw error;
      }
      throw new Error('Health check failed');
    }
  }
}

// Singleton instance
export const tokenServerClient = new TokenServerClient();
