/**
 * Cookie management utilities for authentication
 * Handles HttpOnly cookies for secure token storage
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const COOKIE_NAMES = {
  TENANT_REALM: 'tenant_realm',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CODE_VERIFIER: 'pkce_verifier',
  STATE: 'pkce_state',
  NONCE: 'pkce_nonce',
  PENDING_ID: 'pending_id_param',
  FILE_UPLOAD_PROCESS_ID: 'file_upload_process_id_param',
  REDIRECT_TO: 'redirect_to_param',
} as const;

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

/**
 * Get cookie configuration based on environment
 */
export function getCookieConfig(maxAge?: number): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureCookies = process.env.SECURE_COOKIES === 'true' || isProduction;
  const sameSite = (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax';
  const domain = process.env.COOKIE_DOMAIN || undefined;

  return {
    httpOnly: true,
    secure: secureCookies,
    sameSite: sameSite,
    maxAge: maxAge,
    path: '/',
    domain: domain,
  };
}

/**
 * Set a cookie with standard security options
 */
export async function setCookie(
  name: string,
  value: string,
  maxAge?: number
): Promise<void> {
  const cookieStore = await cookies();
  const config = getCookieConfig(maxAge);
  
  cookieStore.set(name, value, config);
}

/**
 * Get a cookie value
 */
export async function getCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

/**
 * Delete a cookie
 */
export async function deleteCookie(name: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

/**
 * Set tenant realm cookie (long-lived)
 */
export async function setTenantRealm(realm: string): Promise<void> {
  // 30 days
  await setCookie(COOKIE_NAMES.TENANT_REALM, realm, 30 * 24 * 60 * 60);
}

/**
 * Get tenant realm from cookie
 */
export async function getTenantRealm(): Promise<string | undefined> {
  return getCookie(COOKIE_NAMES.TENANT_REALM);
}

/**
 * Store PKCE parameters (short-lived, only for auth flow)
 */
export async function storePKCEParameters(params: {
  codeVerifier: string;
  state: string;
  nonce: string;
  pendingId?: string;
  fileUploadProcessId?: string;
  redirectTo?: string;
}): Promise<void> {
  // 10 minutes - enough time to complete auth flow
  const maxAge = 10 * 60;
  
  await setCookie(COOKIE_NAMES.CODE_VERIFIER, params.codeVerifier, maxAge);
  await setCookie(COOKIE_NAMES.STATE, params.state, maxAge);
  await setCookie(COOKIE_NAMES.NONCE, params.nonce, maxAge);
  
  // Store optional parameters if provided
  if (params.pendingId) {
    await setCookie(COOKIE_NAMES.PENDING_ID, params.pendingId, maxAge);
  }
  if (params.fileUploadProcessId) {
    await setCookie(COOKIE_NAMES.FILE_UPLOAD_PROCESS_ID, params.fileUploadProcessId, maxAge);
  }
  if (params.redirectTo) {
    await setCookie(COOKIE_NAMES.REDIRECT_TO, params.redirectTo, maxAge);
  }
}

/**
 * Retrieve and validate PKCE parameters
 */
export async function retrievePKCEParameters(expectedState: string): Promise<{
  codeVerifier: string;
  state: string;
  nonce: string;
  pendingId?: string;
  fileUploadProcessId?: string;
  redirectTo?: string;
} | null> {
  const codeVerifier = await getCookie(COOKIE_NAMES.CODE_VERIFIER);
  const state = await getCookie(COOKIE_NAMES.STATE);
  const nonce = await getCookie(COOKIE_NAMES.NONCE);
  const pendingId = await getCookie(COOKIE_NAMES.PENDING_ID);
  const fileUploadProcessId = await getCookie(COOKIE_NAMES.FILE_UPLOAD_PROCESS_ID);
  const redirectTo = await getCookie(COOKIE_NAMES.REDIRECT_TO);

  if (!codeVerifier || !state || !nonce) {
    return null;
  }

  // Validate state matches
  if (state !== expectedState) {
    return null;
  }

  return { 
    codeVerifier, 
    state, 
    nonce,
    pendingId,
    fileUploadProcessId,
    redirectTo,
  };
}

/**
 * Clear PKCE parameters after use
 */
export async function clearPKCEParameters(): Promise<void> {
  await deleteCookie(COOKIE_NAMES.CODE_VERIFIER);
  await deleteCookie(COOKIE_NAMES.STATE);
  await deleteCookie(COOKIE_NAMES.NONCE);
  await deleteCookie(COOKIE_NAMES.PENDING_ID);
  await deleteCookie(COOKIE_NAMES.FILE_UPLOAD_PROCESS_ID);
  await deleteCookie(COOKIE_NAMES.REDIRECT_TO);
}

/**
 * Store authentication tokens
 */
export async function storeTokens(params: {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}): Promise<void> {
  const { accessToken, refreshToken, expiresIn } = params;
  
  // Access token expires based on Keycloak's expires_in (typically 5 minutes)
  // Add a small buffer to ensure cookie doesn't outlive token
  const accessTokenMaxAge = expiresIn ? expiresIn - 10 : 5 * 60;
  
  // Refresh token is long-lived (typically 30 minutes to several hours)
  // Store for 1 hour by default
  const refreshTokenMaxAge = 60 * 60;

  await setCookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessTokenMaxAge);
  await setCookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshTokenMaxAge);
}

/**
 * Get access token from cookie
 */
export async function getAccessToken(): Promise<string | undefined> {
  return getCookie(COOKIE_NAMES.ACCESS_TOKEN);
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshToken(): Promise<string | undefined> {
  return getCookie(COOKIE_NAMES.REFRESH_TOKEN);
}

/**
 * Clear all authentication cookies
 */
export async function clearAuthCookies(): Promise<void> {
  await deleteCookie(COOKIE_NAMES.ACCESS_TOKEN);
  await deleteCookie(COOKIE_NAMES.REFRESH_TOKEN);
  await clearPKCEParameters();
}

/**
 * Helper to set cookies in a NextResponse
 */
export function setResponseCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge?: number
): NextResponse {
  const config = getCookieConfig(maxAge);
  
  response.cookies.set(name, value, config);
  return response;
}

/**
 * Helper to delete cookie in a NextResponse
 */
export function deleteResponseCookie(
  response: NextResponse,
  name: string
): NextResponse {
  response.cookies.delete(name);
  return response;
}

/**
 * Helper to set auth tokens in a NextResponse
 */
export function setResponseTokens(
  response: NextResponse,
  params: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
  }
): NextResponse {
  const { accessToken, refreshToken, expiresIn } = params;
  
  const accessTokenMaxAge = expiresIn ? expiresIn - 10 : 5 * 60;
  const refreshTokenMaxAge = 60 * 60;

  setResponseCookie(response, COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessTokenMaxAge);
  setResponseCookie(response, COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshTokenMaxAge);
  
  return response;
}

/**
 * Helper to clear all auth cookies in a NextResponse
 */
export function clearResponseAuthCookies(response: NextResponse): NextResponse {
  deleteResponseCookie(response, COOKIE_NAMES.ACCESS_TOKEN);
  deleteResponseCookie(response, COOKIE_NAMES.REFRESH_TOKEN);
  deleteResponseCookie(response, COOKIE_NAMES.CODE_VERIFIER);
  deleteResponseCookie(response, COOKIE_NAMES.STATE);
  deleteResponseCookie(response, COOKIE_NAMES.NONCE);
  
  return response;
}





