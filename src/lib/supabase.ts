import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    "Missing Supabase env vars. Check .env.local and restart npm run dev."
  );
}

export const supabase = createClient(url, anon);
