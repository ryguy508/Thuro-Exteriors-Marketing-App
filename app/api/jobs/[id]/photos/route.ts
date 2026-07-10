import { NextRequest, NextResponse } from "next/server";
import path from "path";
import db from "@/lib/db";
import { getJob } from "@/lib/jobs";
import { addPhoto, listPhotosForJob, type PhotoKind } from "@/lib/photos";

const ALLOWED_KINDS: PhotoKind[] = ["before", "after"];
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const BUCKET = "job-photos";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = Number(id);
  return NextResponse.json(await listPhotosForJob(jobId));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = Number(id);
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (typeof kind !== "string" || !ALLOWED_KINDS.includes(kind as PhotoKind)) {
    return NextResponse.json(
      { error: "kind must be 'before' or 'after'" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const ext = path.extname(file.name) || "";
  const storagePath = `jobs/${jobId}/${kind}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = db.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  const photo = await addPhoto(
    jobId,
    kind as PhotoKind,
    publicUrlData.publicUrl
  );

  return NextResponse.json(photo, { status: 201 });
}
