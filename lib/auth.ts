import { getSignInUrl, getSignUpUrl, signOut, withAuth } from "@workos-inc/authkit-nextjs";

export { getSignInUrl, getSignUpUrl, signOut, withAuth };

export async function requireAuth() {
  const { user } = await withAuth();
  if (!user) {
    const signInUrl = await getSignInUrl();
    throw new Error(`Unauthorized - redirect to ${signInUrl}`);
  }
  return user;
}

/**
 * Fetches the access token from the auth API endpoint.
 * Used for authenticated GraphQL requests from client components.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/token');
    if (!response.ok) return null;
    const data = await response.json();
    return data.accessToken || null;
  } catch {
    return null;
  }
}
