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
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Extract OAuth parameters from Microsoft's callback
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Build the redirect URL to the integrations page
  const redirectUrl = new URL('/integrations', request.nextUrl.origin);

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
