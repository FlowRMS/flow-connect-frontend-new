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
