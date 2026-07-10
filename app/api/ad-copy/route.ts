import { NextRequest, NextResponse } from "next/server";
import { generateAdCopy, type AdCopyRequest } from "@/lib/claude";
import { errorToResult } from "@/lib/providerError";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AdCopyRequest;

  if (!body.serviceType || !body.platform || !body.details) {
    return NextResponse.json(
      { error: "serviceType, platform, and details are required" },
      { status: 400 }
    );
  }

  try {
    const result = await generateAdCopy(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(errorToResult(err));
  }
}
