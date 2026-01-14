/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0 Authorization Code Flow
 * Implements RFC 7636 with S256 (SHA-256) code challenge method
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random string for PKCE code_verifier
 * Per RFC 7636, code_verifier must be 43-128 characters (not bytes).
 * We generate 96 random bytes which produces a ~128-character base64url string.
 * 
 * Formula: base64url encoding increases size by ~4/3, so:
 * - 32 bytes → ~43 chars (minimum)
 * - 96 bytes → ~128 chars (maximum, recommended)
 * 
 * @returns Base64URL-encoded random string (128 characters)
 */
export function generateCodeVerifier(): string {
  // Generate 96 bytes to get ~128 characters after base64url encoding
  // This ensures we stay within the RFC 7636 limit of 43-128 characters
  const randomBytes = crypto.randomBytes(96);
  return base64URLEncode(randomBytes);
}

/**
 * Generate code_challenge from code_verifier using S256 method (SHA-256)
 * @param verifier - The code_verifier string
 * @returns Base64URL-encoded SHA-256 hash of the verifier
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64URLEncode(hash);
}

/**
 * Generate a cryptographically secure random state parameter
 * @param length - Length in bytes (default: 32)
 * @returns Base64URL-encoded random string
 */
export function generateState(length: number = 32): string {
  const randomBytes = crypto.randomBytes(length);
  return base64URLEncode(randomBytes);
}

/**
 * Generate a cryptographically secure random nonce
 * @param length - Length in bytes (default: 32)
 * @returns Base64URL-encoded random string
 */
export function generateNonce(length: number = 32): string {
  const randomBytes = crypto.randomBytes(length);
  return base64URLEncode(randomBytes);
}

/**
 * Base64URL encode a buffer (RFC 4648 Section 5)
 * Converts base64 to base64url by replacing + with -, / with _, and removing padding =
 */
function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Validate that a realm name is safe (alphanumeric, hyphens, underscores only)
 * Prevents injection attacks through realm parameter
 */
export function isValidRealm(realm: string): boolean {
  if (!realm || typeof realm !== 'string') return false;
  // Allow alphanumeric, hyphens, and underscores only, 1-100 characters
  return /^[a-zA-Z0-9_-]{1,100}$/.test(realm);
}

/**
 * Check if a realm is in the allowlist (if configured)
 * @param realm - Realm name to check
 * @param allowlist - Array of allowed realms, or null/empty to allow all
 * @returns true if realm is allowed
 */
export function isRealmAllowed(realm: string, allowlist: string[] | null): boolean {
  if (!allowlist || allowlist.length === 0) return true;
  return allowlist.includes(realm);
}

/**
 * Build the Keycloak authorization URL with PKCE parameters
 */
export function buildAuthorizationUrl(params: {
  keycloakBaseUrl: string;
  realm: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  nonce: string;
  scope?: string;
}): string {
  const {
    keycloakBaseUrl,
    realm,
    clientId,
    redirectUri,
    codeChallenge,
    state,
    nonce,
    scope = 'openid',
  } = params;

  const authUrl = new URL(
    `/realms/${realm}/protocol/openid-connect/auth`,
    keycloakBaseUrl
  );

  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);

  return authUrl.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(params: {
  keycloakBaseUrl: string;
  realm: string;
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}> {
  const { keycloakBaseUrl, realm, clientId, code, redirectUri, codeVerifier } = params;

  const tokenUrl = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  console.log('');
  console.log('📋 Token Request Details:');
  console.log('   • Token URL:', tokenUrl);
  console.log('   • Client ID:', clientId);
  console.log('   • Redirect URI:', redirectUri);
  console.log('   • Code Length:', code.length, 'characters');
  console.log('   • Verifier Length:', codeVerifier.length, 'characters');
  console.log('   • Code (first 40 chars):', code.substring(0, 40) + '...');
  console.log('   • Verifier (first 40 chars):', codeVerifier.substring(0, 40) + '...');
  console.log('');
  console.log('📤 Full Request Body:');
  console.log('   ', body.toString().substring(0, 200) + '...');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  console.log('');
  console.log('📥 Token Response from Keycloak:');
  console.log('   • Status:', response.status, response.statusText);
  console.log('   • Content-Type:', response.headers.get('content-type'));

  const responseText = await response.text();
  
  if (!response.ok) {
    console.error('');
    console.error('❌ TOKEN EXCHANGE FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('📊 Request Summary:');
    console.error('   • Status:', response.status, response.statusText);
    console.error('   • Client ID:', clientId);
    console.error('   • Realm:', realm);
    console.error('   • Code Length:', code.length);
    console.error('   • Verifier Length:', codeVerifier.length);
    console.error('');
    console.error('📄 Error Response:');
    console.error('   ', responseText);
    console.error('');
    console.error('🔍 Debugging Tips:');
    console.error('   1. Verify code_verifier length is 43-128 chars:', codeVerifier.length >= 43 && codeVerifier.length <= 128);
    console.error('   2. Check that code_challenge was generated with S256 (SHA-256)');
    console.error('   3. Ensure redirect_uri matches exactly what was sent to /auth');
    console.error('   4. Verify authorization code has not expired (typically 60 seconds)');
    console.error('   5. Confirm Keycloak client is configured for PKCE (public client)');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    throw new Error(`Token exchange failed: ${response.status} ${responseText}`);
  }

  console.log('');
  console.log('✅ Token exchange successful');
  console.log('   • Response contains access_token and refresh_token');

  return JSON.parse(responseText);
}

/**
 * Refresh tokens using refresh_token grant
 */
export async function refreshTokens(params: {
  keycloakBaseUrl: string;
  realm: string;
  clientId: string;
  refreshToken: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}> {
  const { keycloakBaseUrl, realm, clientId, refreshToken } = params;

  const tokenUrl = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Build the Keycloak logout URL
 */
export function buildLogoutUrl(params: {
  keycloakBaseUrl: string;
  realm: string;
  clientId: string;
  postLogoutRedirectUri: string;
}): string {
  const { keycloakBaseUrl, realm, clientId, postLogoutRedirectUri } = params;

  const logoutUrl = new URL(
    `/realms/${realm}/protocol/openid-connect/logout`,
    keycloakBaseUrl
  );

  logoutUrl.searchParams.set('client_id', clientId);
  logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);

  return logoutUrl.toString();
}

/**
 * Decode JWT token (without verification - for reading claims only)
 * WARNING: This does NOT verify the token signature. Only use for reading non-sensitive claims.
 */
export function decodeJWT(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    throw new Error('Failed to decode JWT');
  }
}

/**
 * Check if a token is expired (with optional buffer time)
 */
export function isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded.exp || typeof decoded.exp !== 'number') return true;
    
    const now = Math.floor(Date.now() / 1000);
    const expiryWithBuffer = decoded.exp - bufferSeconds;
    
    return now >= expiryWithBuffer;
  } catch {
    return true; // Treat decode errors as expired
  }
}





