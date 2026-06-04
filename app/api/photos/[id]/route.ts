import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) return Response.json({ error: "photo not found" }, { status: 404 });

  await deleteObject(photo.publicId);
  await prisma.photo.delete({ where: { id } });

  return Response.json({ ok: true });
}
