import { NextRequest, NextResponse } from "next/server";
import { checkTask, type MediaKind } from "@/lib/kie";
import { errorToResult } from "@/lib/providerError";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const mediaKind = searchParams.get("mediaKind") as MediaKind;

  if (!taskId || (mediaKind !== "image" && mediaKind !== "video")) {
    return NextResponse.json(
      { error: "taskId and mediaKind ('image' or 'video') are required" },
      { status: 400 }
    );
  }

  try {
    const result = await checkTask(taskId, mediaKind);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(errorToResult(err));
  }
}
