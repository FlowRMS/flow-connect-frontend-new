"use server";

import { signOut } from "@workos-inc/authkit-nextjs";

export async function handleSignOut() {
  const returnTo = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await signOut({ returnTo });
}
