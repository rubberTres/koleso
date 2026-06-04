import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { UserModel } from "./generated/prisma/models";

export class AuthError extends Error {
  constructor(public kind: "UNAUTHORIZED" | "FORBIDDEN") {
    super(kind);
  }
}

// Returns the local User row mirroring the signed-in Clerk user, or null when
// signed out. Does a just-in-time create so the app works even before the
// webhook is wired (the webhook is the proactive sync; this is the lazy path).
export async function getCurrentUser(): Promise<UserModel | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  return prisma.user.create({
    data: {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
      imageUrl: clerkUser.imageUrl ?? null,
    },
  });
}

export async function requireUser(): Promise<UserModel> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHORIZED");
  return user;
}

export async function requireAdmin(): Promise<UserModel> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AuthError("FORBIDDEN");
  return user;
}

// Wraps a route handler so AuthError becomes 401/403 instead of 500.
// Other errors propagate to Next.js for default 500 handling.
export async function withAuth(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (e) {
    if (e instanceof AuthError) {
      const status = e.kind === "UNAUTHORIZED" ? 401 : 403;
      return Response.json({ error: e.kind.toLowerCase() }, { status });
    }
    throw e;
  }
}
