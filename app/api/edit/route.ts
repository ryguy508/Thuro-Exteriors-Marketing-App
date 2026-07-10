import { NextRequest, NextResponse } from "next/server";
import { editMedia, type EditKind } from "@/lib/higgsfield";
import { errorToResult } from "@/lib/providerError";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind") as EditKind;
  const instructions = (formData.get("instructions") as string) || "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!["edit-image", "animate-image", "edit-video"].includes(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  try {
    const result = await editMedia(kind, instructions, file);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(errorToResult(err));
  }
}
