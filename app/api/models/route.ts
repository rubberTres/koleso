import type { NextRequest } from "next/server";
import { requireAdmin, withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Public. Optionally filter by makeId.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const makeId = url.searchParams.get("makeId") ?? undefined;

  const models = await prisma.carModel.findMany({
    where: { makeId },
    include: {
      make: true,
      _count: { select: { cars: true } },
    },
    orderBy: [{ make: { name: "asc" } }, { name: "asc" }],
  });
  return Response.json(models);
}

// Admin only.
export async function POST(req: NextRequest) {
  return withAuth(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body || typeof body.makeId !== "string" || typeof body.name !== "string" || body.name.trim() === "") {
      return Response.json({ error: "makeId (string) and name (non-empty string) required" }, { status: 400 });
    }
    const make = await prisma.carMake.findUnique({ where: { id: body.makeId }, select: { id: true } });
    if (!make) return Response.json({ error: "make not found" }, { status: 404 });

    const model = await prisma.carModel.create({
      data: { makeId: make.id, name: body.name.trim() },
    });
    return Response.json(model, { status: 201 });
  });
}
