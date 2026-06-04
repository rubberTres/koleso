import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cars = await prisma.car.findMany({
    include: { _count: { select: { photos: true, fittings: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(cars);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.brand !== "string" || typeof body.model !== "string") {
    return Response.json({ error: "brand and model are required strings" }, { status: 400 });
  }
  const car = await prisma.car.create({
    data: {
      brand: body.brand,
      model: body.model,
      year: typeof body.year === "number" ? body.year : null,
      bodyType: typeof body.bodyType === "string" ? body.bodyType : null,
    },
  });
  return Response.json(car, { status: 201 });
}
