import db from "./db";

export type PhotoKind = "before" | "after";

export type JobPhoto = {
  id: number;
  job_id: number;
  kind: PhotoKind;
  file_path: string;
  created_at: string;
};

export async function listPhotosForJob(jobId: number): Promise<JobPhoto[]> {
  const { data, error } = await db
    .from("job_photos")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as JobPhoto[];
}

export async function addPhoto(
  jobId: number,
  kind: PhotoKind,
  filePath: string
): Promise<JobPhoto> {
  const { data, error } = await db
    .from("job_photos")
    .insert({ job_id: jobId, kind, file_path: filePath })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as JobPhoto;
}
