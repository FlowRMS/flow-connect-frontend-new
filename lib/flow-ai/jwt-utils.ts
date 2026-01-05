/**
 * JWT decoding utilities
 */

export interface JWTPayload {
  email?: string;
  name?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Decode a JWT token to extract the payload
 * @param token - The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // Split the token by dots
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }
    
    // Get the payload (middle part)
    const payload = parts[1];
    
    // Base64-URL decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract user information from JWT token
 * @param token - The JWT token
 * @returns User email and name or null if not found
 */
export function extractUserInfoFromToken(token: string): { email: string; name: string } | null {
  const payload = decodeJWT(token);
  
  if (!payload) {
    return null;
  }
  
  const email = payload.email || payload.sub || 'Unknown';
  const name = payload.name || payload.email || 'Unknown User';
  
  return { email, name };
}





