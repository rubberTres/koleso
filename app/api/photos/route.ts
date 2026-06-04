import type { NextRequest } from "next/server";
import { AuthError, requireUser, withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/storage";

// Authenticated: record a Photo row after the client confirms the R2 PUT.
export async function POST(req: NextRequest) {
  return withAuth(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body || typeof body.carId !== "string" || typeof body.key !== "string") {
      return Response.json(
        { error: "carId (string) and key (string) are required" },
        { status: 400 },
      );
    }

    const car = await prisma.car.findUnique({
      where: { id: body.carId },
      select: { id: true, userId: true },
    });
    if (!car) return Response.json({ error: "car not found" }, { status: 404 });
    if (car.userId !== user.id && user.role !== "ADMIN") {
      throw new AuthError("FORBIDDEN");
    }

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
  });
}
