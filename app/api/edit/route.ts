import { NextRequest, NextResponse } from "next/server";
import { startEdit, type EditKind } from "@/lib/kie";
import { errorToResult } from "@/lib/providerError";
import type { ContentType } from "@/lib/promptDirectives";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("file").filter((f): f is File => f instanceof File);
  const kind = formData.get("kind") as EditKind;
  const instructions = (formData.get("instructions") as string) || "";
  const contentType = ((formData.get("contentType") as string) || "social_ad") as ContentType;

  if (files.length === 0) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!["edit-image", "animate-image", "edit-video"].includes(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  try {
    const result = await startEdit(kind, instructions, files, contentType);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(errorToResult(err));
  }
}
