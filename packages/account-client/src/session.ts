import { supabase } from "./supabase";

/**
 * Ensures the caller has a Supabase session (anonymous is fine — the
 * `draft` function accepts anonymous sessions per RDD.md Gate 1). Called
 * lazily right before the first draft request rather than eagerly at app
 * boot, so the app has exactly one screen transition with no separate
 * "signing in..." state.
 */
export async function ensureAnonymousSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(`Failed to start a session: ${error.message}`);
  }
}

/**
 * True if the current session belongs to an anonymous (not-yet-upgraded)
 * user, false for a real account, and false if there's no session at all.
 * `is_anonymous` comes from the JWT/user record, set by Supabase itself --
 * it flips to false the moment `auth.updateUser` links a real identity.
 */
export async function isAnonymousSession(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return data.user?.is_anonymous ?? false;
}
