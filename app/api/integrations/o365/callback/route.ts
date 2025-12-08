import { NextRequest, NextResponse } from 'next/server';

/**
 * Microsoft 365 OAuth Callback Handler
 *
 * This route receives the OAuth callback from Microsoft and redirects
 * to the frontend integrations page with the code and state parameters.
 *
 * Microsoft redirects here with:
 * - code: Authorization code to exchange for tokens
 * - state: CSRF protection state
 * - error: Error code if auth failed
 * - error_description: Human-readable error message
 */

function getBaseUrl(request: NextRequest): string {
  // Check for forwarded headers (used by reverse proxies like Render, Vercel, etc.)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Check the host header
  const host = request.headers.get('host');
  if (host && !host.includes('localhost')) {
    return `https://${host}`;
  }

  // Fallback to environment variable if set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Last resort: use the request origin (may be internal URL on some platforms)
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Extract OAuth parameters from Microsoft's callback
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Build the redirect URL to the integrations page
  const baseUrl = getBaseUrl(request);
  const redirectUrl = new URL('/integrations', baseUrl);

  // Pass through all relevant parameters
  if (code) {
    redirectUrl.searchParams.set('code', code);
  }
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }
  if (error) {
    redirectUrl.searchParams.set('error', error);
  }
  if (errorDescription) {
    redirectUrl.searchParams.set('error_description', errorDescription);
  }

  // Redirect to the frontend integrations page
  return NextResponse.redirect(redirectUrl.toString());
}
