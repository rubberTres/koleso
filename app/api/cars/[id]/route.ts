import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      fittings: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!car) return Response.json({ error: "car not found" }, { status: 404 });
  return Response.json(car);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const car = await prisma.car.findUnique({ where: { id }, select: { id: true } });
  if (!car) return Response.json({ error: "car not found" }, { status: 404 });
  await prisma.car.delete({ where: { id } });
  return Response.json({ ok: true });
}
