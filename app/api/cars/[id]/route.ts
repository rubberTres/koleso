import type { NextRequest } from "next/server";
import { AuthError, requireUser, withAuth } from "@/lib/auth";
import {
  BodyType,
  TireProfile,
  TireWidth,
  WheelSize,
  WheelWidth,
} from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

function inEnum<T extends Record<string, string>>(e: T, v: unknown): v is T[keyof T] {
  return typeof v === "string" && (Object.values(e) as string[]).includes(v);
}

// Public.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      model: { include: { make: true } },
      owner: { select: { id: true, name: true, imageUrl: true } },
      photos: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!car) return Response.json({ error: "car not found" }, { status: 404 });
  return Response.json(car);
}

// Owner or admin.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    const existing = await prisma.car.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return Response.json({ error: "car not found" }, { status: 404 });
    if (existing.userId !== user.id && user.role !== "ADMIN") {
      throw new AuthError("FORBIDDEN");
    }

    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: "invalid body" }, { status: 400 });

    const car = await prisma.car.update({
      where: { id },
      data: {
        modelId: typeof body.modelId === "string" ? body.modelId : undefined,
        year: body.year === null ? null : typeof body.year === "number" ? body.year : undefined,
        bodyType: body.bodyType === null ? null : inEnum(BodyType, body.bodyType) ? body.bodyType : undefined,
        wheelSize: inEnum(WheelSize, body.wheelSize) ? body.wheelSize : undefined,
        wheelWidth: body.wheelWidth === null ? null : inEnum(WheelWidth, body.wheelWidth) ? body.wheelWidth : undefined,
        et: body.et === null ? null : typeof body.et === "number" ? body.et : undefined,
        tireWidth: body.tireWidth === null ? null : inEnum(TireWidth, body.tireWidth) ? body.tireWidth : undefined,
        tireProfile: body.tireProfile === null ? null : inEnum(TireProfile, body.tireProfile) ? body.tireProfile : undefined,
      },
    });
    return Response.json(car);
  });
}

// Owner or admin. Cascades to photos in DB (R2 objects orphaned).
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    const car = await prisma.car.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!car) return Response.json({ error: "car not found" }, { status: 404 });
    if (car.userId !== user.id && user.role !== "ADMIN") {
      throw new AuthError("FORBIDDEN");
    }
    await prisma.car.delete({ where: { id } });
    return Response.json({ ok: true });
  });
}
