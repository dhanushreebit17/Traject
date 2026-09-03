// lib/supabaseClient.js
// One shared Supabase client for the whole app. Import this
// wherever you need to talk to the database, auth, or storage.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check .env.local has ' +
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);