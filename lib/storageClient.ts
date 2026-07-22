import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local."
  );
}

// Browser-only client using the anon key — relies on the "Allow anon uploads
// to scratch prefix" storage policy (supabase/migration.sql) to restrict it
// to the scratch/ prefix only.
const dbBrowser = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a file directly from the browser to Supabase Storage, bypassing
 * our Vercel functions entirely so their request body size limit (4.5MB)
 * never applies to reference photos used by the Media generate/edit tools.
 */
export async function uploadScratchFileFromBrowser(file: File): Promise<string> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const storagePath = `scratch/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await dbBrowser.storage
    .from("job-photos")
    .upload(storagePath, file, { contentType: file.type });

  if (error) throw new Error(`Upload to storage failed: ${error.message}`);

  const { data } = dbBrowser.storage.from("job-photos").getPublicUrl(storagePath);
  return data.publicUrl;
}
