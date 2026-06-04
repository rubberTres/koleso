import type { NextRequest } from "next/server";
import { requireAdmin, withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin only. Blocked by Restrict if any Car references this model.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(async () => {
    await requireAdmin();
    const { id } = await ctx.params;
    const model = await prisma.carModel.findUnique({ where: { id }, select: { id: true } });
    if (!model) return Response.json({ error: "model not found" }, { status: 404 });
    await prisma.carModel.delete({ where: { id } });
    return Response.json({ ok: true });
  });
}
