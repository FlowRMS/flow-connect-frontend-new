import { handleAuth } from "@workos-inc/authkit-nextjs";

const baseURL = process.env.NEXT_PUBLIC_APP_URL;

export const GET = handleAuth({
  returnPathname: "/",
  ...(baseURL && { baseURL }),
});
