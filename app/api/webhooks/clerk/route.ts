import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";

// Clerk webhook receiver. Configure the endpoint in the Clerk dashboard
// (Webhooks → Add Endpoint → URL pointing to this route) and set
// CLERK_WEBHOOK_SIGNING_SECRET in .env. Without the webhook the app still
// works thanks to the just-in-time sync in lib/auth.ts#getCurrentUser, but
// stale Clerk profile updates won't reach us until the next auth check.
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const clerkId = evt.data.id;
      const email = evt.data.email_addresses?.[0]?.email_address ?? null;
      const name =
        [evt.data.first_name, evt.data.last_name].filter(Boolean).join(" ") || null;
      const imageUrl = evt.data.image_url ?? null;

      await prisma.user.upsert({
        where: { clerkId },
        create: { clerkId, email, name, imageUrl },
        update: { email, name, imageUrl },
      });
      break;
    }
    case "user.deleted": {
      const clerkId = evt.data.id;
      if (clerkId) {
        await prisma.user.deleteMany({ where: { clerkId } });
      }
      break;
    }
    // ignore everything else
  }

  return Response.json({ ok: true });
}
