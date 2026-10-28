import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qzawcoatmlfyahigudkt.supabase.co'; // ⚠️ শেষে যেন কোনো '/' না থাকে
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6YXdjb2F0bWxmeWFoaWd1ZGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjA0NTEsImV4cCI6MjA5NjIzNjQ1MX0.PUsYeYNhA1snamM56y48umo_7LUItZRst3U2NAcNE6U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});