import type { NextRequest } from "next/server";
import { AuthError, requireUser, withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";

// Owner or admin.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: { car: { select: { userId: true } } },
    });
    if (!photo) return Response.json({ error: "photo not found" }, { status: 404 });
    if (photo.car.userId !== user.id && user.role !== "ADMIN") {
      throw new AuthError("FORBIDDEN");
    }

    await deleteObject(photo.publicId);
    await prisma.photo.delete({ where: { id } });
    return Response.json({ ok: true });
  });
}
