import type { NextRequest } from "next/server";
import { requireAdmin, withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin only. Cascades to CarModels; Cars referencing those models block delete (Restrict).
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(async () => {
    await requireAdmin();
    const { id } = await ctx.params;
    const make = await prisma.carMake.findUnique({ where: { id }, select: { id: true } });
    if (!make) return Response.json({ error: "make not found" }, { status: 404 });
    await prisma.carMake.delete({ where: { id } });
    return Response.json({ ok: true });
  });
}
