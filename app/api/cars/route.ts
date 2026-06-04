import type { NextRequest } from "next/server";
import { requireUser, withAuth } from "@/lib/auth";
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

// Public: browse all submissions with optional filters.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const modelId = url.searchParams.get("modelId") ?? undefined;
  const wheelSizeParam = url.searchParams.get("wheelSize");
  const wheelSize = inEnum(WheelSize, wheelSizeParam) ? wheelSizeParam : undefined;

  const cars = await prisma.car.findMany({
    where: { modelId, wheelSize },
    include: {
      model: { include: { make: true } },
      owner: { select: { id: true, name: true, imageUrl: true } },
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(cars);
}

// Authenticated: create a submission tied to the current user.
export async function POST(req: NextRequest) {
  return withAuth(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body || typeof body.modelId !== "string" || !inEnum(WheelSize, body.wheelSize)) {
      return Response.json(
        { error: "modelId (string) and wheelSize (enum) are required" },
        { status: 400 },
      );
    }
    const model = await prisma.carModel.findUnique({
      where: { id: body.modelId },
      select: { id: true },
    });
    if (!model) return Response.json({ error: "model not found" }, { status: 404 });

    const car = await prisma.car.create({
      data: {
        userId: user.id,
        modelId: model.id,
        year: typeof body.year === "number" ? body.year : null,
        bodyType: inEnum(BodyType, body.bodyType) ? body.bodyType : null,
        wheelSize: body.wheelSize,
        wheelWidth: inEnum(WheelWidth, body.wheelWidth) ? body.wheelWidth : null,
        et: typeof body.et === "number" ? body.et : null,
        tireWidth: inEnum(TireWidth, body.tireWidth) ? body.tireWidth : null,
        tireProfile: inEnum(TireProfile, body.tireProfile) ? body.tireProfile : null,
      },
    });
    return Response.json(car, { status: 201 });
  });
}
