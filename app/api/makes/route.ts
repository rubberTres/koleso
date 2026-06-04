import type { NextRequest } from "next/server";
import { requireAdmin, withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Public.
export async function GET() {
  const makes = await prisma.carMake.findMany({
    include: { _count: { select: { models: true } } },
    orderBy: { name: "asc" },
  });
  return Response.json(makes);
}

// Admin only.
export async function POST(req: NextRequest) {
  return withAuth(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body || typeof body.name !== "string" || body.name.trim() === "") {
      return Response.json({ error: "name (non-empty string) required" }, { status: 400 });
    }
    const make = await prisma.carMake.create({ data: { name: body.name.trim() } });
    return Response.json(make, { status: 201 });
  });
}
