import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.carId !== "string" || typeof body.key !== "string") {
    return Response.json(
      { error: "carId (string) and key (string) are required" },
      { status: 400 },
    );
  }

  const car = await prisma.car.findUnique({ where: { id: body.carId }, select: { id: true } });
  if (!car) return Response.json({ error: "car not found" }, { status: 404 });

  const photo = await prisma.photo.create({
    data: {
      carId: car.id,
      publicId: body.key,
      url: getPublicUrl(body.key),
      width: typeof body.width === "number" ? body.width : null,
      height: typeof body.height === "number" ? body.height : null,
    },
  });
  return Response.json(photo, { status: 201 });
}
