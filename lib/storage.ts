import db from "./db";

/**
 * Uploads a file to Supabase Storage so external APIs (Higgsfield, kie.ai)
 * that require a public URL, not raw bytes, can fetch it. Reuses the
 * job-photos bucket under a "scratch/" prefix for anything not attached to
 * a specific job.
 */
export async function uploadScratchFile(file: File): Promise<string> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const storagePath = `scratch/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await db.storage
    .from("job-photos")
    .upload(storagePath, buffer, { contentType: file.type });

  if (error) throw new Error(`Upload to storage failed: ${error.message}`);

  const { data } = db.storage.from("job-photos").getPublicUrl(storagePath);
  return data.publicUrl;
}
