import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

/**
 * Get tokens endpoint for FlowAI WebSocket connections
 * Returns the WorkOS access token for use in WebSocket auth
 * 
 * This endpoint is needed because WebSocket connections can't use
 * HttpOnly cookies directly - they need the token in connectionParams
 */
export async function GET() {
  try {
    const { user, accessToken } = await withAuth();

    if (!user || !accessToken) {
      return NextResponse.json(
        {
          error: 'no_tokens',
          message: 'No authentication tokens found - please sign in',
        },
        { status: 404 }
      );
    }

    // Return the WorkOS access token for WebSocket authentication
    // Note: WorkOS doesn't use refresh tokens in the same way as Keycloak
    // The accessToken is sufficient for API authentication
    const response = {
      accessToken: accessToken,
      refreshToken: null, // WorkOS handles token refresh internally
      // WorkOS tokens are typically valid for 15 minutes
      // The exact expiry is handled by WorkOS internally
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to get WorkOS tokens:', error);
    return NextResponse.json(
      {
        error: 'token_error',
        message: error instanceof Error ? error.message : 'Failed to get authentication tokens',
      },
      { status: 500 }
    );
  }
}
