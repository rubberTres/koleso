import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicUrl, getUploadUrl } from "@/lib/storage";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.carId !== "string" || typeof body.contentType !== "string") {
    return Response.json(
      { error: "carId (string) and contentType (string) are required" },
      { status: 400 },
    );
  }
  const ext = EXT_BY_TYPE[body.contentType];
  if (!ext) {
    return Response.json(
      { error: `contentType must be one of: ${Object.keys(EXT_BY_TYPE).join(", ")}` },
      { status: 400 },
    );
  }

  const car = await prisma.car.findUnique({ where: { id: body.carId }, select: { id: true } });
  if (!car) return Response.json({ error: "car not found" }, { status: 404 });

  const key = `cars/${car.id}/${randomUUID()}.${ext}`;
  const uploadUrl = await getUploadUrl(key, body.contentType);

  return Response.json({ uploadUrl, key, publicUrl: getPublicUrl(key) });
}
