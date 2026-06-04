import { clerkMiddleware } from "@clerk/nextjs/server";

// Public-first: default is unauthenticated, route handlers enforce auth via
// lib/auth.ts helpers (requireUser / requireRole / ownership checks).
// The proxy only sets up the auth context.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
