import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
  redirectUri: process.env.WORKOS_REDIRECT_URI!,
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/sign-in", "/sign-up", "/auth-error", "/api/auth/callback"],
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
