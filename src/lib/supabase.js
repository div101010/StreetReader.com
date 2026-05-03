import { createClient } from '@supabase/supabase-js';

// Read from Vite's env layer so the same code works in local dev and on
// Vercel. Locally these come from .env (gitignored); in production they
// come from the Vercel Project → Settings → Environment Variables.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Set them in .env for local dev and in Vercel → Settings → ' +
      'Environment Variables for production.',
  );
}

// Single shared client. Auth headers are sent automatically by supabase-js,
// but we set them explicitly here so a network or CORS layer can't strip them.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  db: { schema: 'public' },
  global: {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  },
});

export function rowToExperience(row) {
  return {
    id: row.id,
    position: [Number(row.x_coord), Number(row.z_coord)],
    type: row.category,
    text: row.content,
    createdAt: row.created_at,
    ownerId: row.owner_id ?? null,
  };
}

// Send a meta-feedback entry to the platform_feedback table. RLS is currently
// disabled on this table, so the anon client can insert directly. Returns
// { data } on success, { error } on failure (network or DB-level).
export async function submitPlatformFeedback(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return { error: { message: 'Empty submission.' } };
  }
  try {
    const { data, error } = await supabase
      .from('platform_feedback')
      .insert({ content: trimmed })
      .select()
      .single();
    if (error) {
      console.error('[supabase] platform_feedback insert failed:', error.message);
      return { error };
    }
    return { data };
  } catch (err) {
    console.error('[supabase] platform_feedback exception:', err);
    return { error: { message: err?.message || 'Network error' } };
  }
}
