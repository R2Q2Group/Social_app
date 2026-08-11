// Gate 3.5: the R2Q2 account layer. Every caller already has (or lazily
// gets, via ensureAnonymousSession) an anonymous Supabase session per Gate
// 1's identity model, so "signing up" here means upgrading that session in
// place with auth.updateUser -- same user_id, so byok_keys/usage_daily/
// entitlements rows all carry over untouched. Signing in from a second app
// install with the same email/password resolves to that same user_id too,
// which is what makes the account "shared across apps" without any explicit
// sync code: it's the same auth.users row underneath.
import { supabase } from "./supabase";
import { ensureAnonymousSession, isAnonymousSession } from "./session";

export class AlreadySignedInError extends Error {}

/**
 * Upgrades the current anonymous session to a real email/password account.
 * Throws AlreadySignedInError if the caller already has a permanent
 * account -- use signInWithEmail to switch accounts instead.
 */
export async function upgradeAnonymousAccount(
  email: string,
  password: string,
): Promise<void> {
  await ensureAnonymousSession();

  if (!(await isAnonymousSession())) {
    throw new AlreadySignedInError(
      "This device is already signed into a real account.",
    );
  }

  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
}

/** Signs into an existing permanent account, e.g. from a second device or
 * app install, or after signOut on this one. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new Error(`Sign in failed: ${error.message}`);
  }
}

/** Ends the current session. The next draft request lazily starts a fresh
 * anonymous one via ensureAnonymousSession, per Gate 1's identity model. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

export interface AccountState {
  email: string | null;
  isAnonymous: boolean;
}

export async function getAccountState(): Promise<AccountState> {
  // Without this, a cold Account-screen visit can race a concurrent
  // ensureAnonymousSession() elsewhere (e.g. getEntitlement(), called
  // alongside this in Promise.all) and read "no session yet" as a signed-in
  // account with a null email instead of a fresh anonymous one.
  await ensureAnonymousSession();

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { email: null, isAnonymous: false };
  }
  return {
    email: data.user.email ?? null,
    isAnonymous: data.user.is_anonymous ?? false,
  };
}
