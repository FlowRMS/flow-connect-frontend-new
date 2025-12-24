import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { accessToken } = await withAuth();

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
