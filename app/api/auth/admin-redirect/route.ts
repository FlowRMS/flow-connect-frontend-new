import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const adminUrl = process.env.ADMIN_PORTAL_URL || "https://admin.flowrms.com/dashboard";

  // Clear the WorkOS session cookie manually
  const cookieStore = await cookies();
  cookieStore.delete("wos-session");

  // Redirect to admin portal
  return NextResponse.redirect(adminUrl);
}
