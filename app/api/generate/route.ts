import { NextRequest, NextResponse } from "next/server";
import { generateMedia, type GenerateMode } from "@/lib/higgsfield";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const mode = body.mode as GenerateMode;
  const prompt = body.prompt as string;

  if (!prompt || (mode !== "image" && mode !== "video")) {
    return NextResponse.json(
      { error: "mode ('image' or 'video') and prompt are required" },
      { status: 400 }
    );
  }

  const result = await generateMedia(mode, prompt);
  return NextResponse.json(result);
}
