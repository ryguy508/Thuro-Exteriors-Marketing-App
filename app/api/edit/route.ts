import { NextRequest, NextResponse } from "next/server";
import { startEdit, type EditKind } from "@/lib/kie";
import { errorToResult } from "@/lib/providerError";
import type { ContentType } from "@/lib/promptDirectives";

export const maxDuration = 60;

type EditRequestBody = {
  kind?: EditKind;
  instructions?: string;
  contentType?: ContentType;
  imageUrls?: string[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as EditRequestBody | null;
  const kind = body?.kind;
  const instructions = body?.instructions ?? "";
  const contentType = body?.contentType ?? "social_ad";
  const imageUrls = body?.imageUrls ?? [];

  if (imageUrls.length === 0) {
    return NextResponse.json({ error: "imageUrls is required" }, { status: 400 });
  }

  if (!kind || !["edit-image", "animate-image", "edit-video"].includes(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  try {
    const result = await startEdit(kind, instructions, imageUrls, contentType);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(errorToResult(err));
  }
}
