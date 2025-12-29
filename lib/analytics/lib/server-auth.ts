import { NextRequest } from 'next/server';

export interface AuthResult {
  isValid: boolean;
  token?: string;
  error?: string;
}

/**
 * Validate authorization from request headers
 */
export function validateAuth(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return { isValid: false, error: 'No authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return { isValid: false, error: 'No token provided' };
  }

  // Basic JWT validation (check if it's properly formatted)
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid token format' };
    }

    // Decode the payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    
    if (payload.exp && payload.exp < now) {
      return { isValid: false, error: 'Token expired' };
    }

    return { isValid: true, token };
  } catch (error) {
    return { isValid: false, error: 'Invalid token' };
  }
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(message = 'Unauthorized') {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}