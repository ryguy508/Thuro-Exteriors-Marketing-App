import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local."
  );
}

// Server-only client using the service role key — never import this from
// client components, it bypasses row-level security.
const db = createClient(supabaseUrl, supabaseServiceRoleKey);

export default db;
