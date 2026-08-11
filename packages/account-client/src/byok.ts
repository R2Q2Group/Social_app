// Gate 5: BYOK settings client wrapper. The backend RPCs
// (set_byok_key/delete_byok_key) and the byok_keys_select_own RLS policy
// were built in Gate 1 for the draft Edge Function's own lookup -- this is
// the first client-facing wrapper around them, for the account screen's
// BYOK settings section.
import { supabase } from "./supabase";
import { ensureAnonymousSession } from "./session";

export type ByokProvider = "anthropic" | "openai";

export interface ByokKeyStatus {
  provider: ByokProvider;
  hasKey: boolean;
  createdAt: string | null;
}

const PROVIDERS: ByokProvider[] = ["anthropic", "openai"];

/** One status entry per known provider, so the UI can render a "not set"
 * row even for providers with no byok_keys row yet. */
export async function listByokKeys(): Promise<ByokKeyStatus[]> {
  await ensureAnonymousSession();

  const { data, error } = await supabase
    .from("byok_keys")
    .select("provider, created_at");

  if (error) {
    throw new Error(`Failed to load BYOK keys: ${error.message}`);
  }

  const rows = new Map(
    (data ?? []).map((row) => [row.provider as ByokProvider, row.created_at as string]),
  );

  return PROVIDERS.map((provider) => ({
    provider,
    hasKey: rows.has(provider),
    createdAt: rows.get(provider) ?? null,
  }));
}

export async function setByokKey(provider: ByokProvider, key: string): Promise<void> {
  await ensureAnonymousSession();

  const { error } = await supabase.rpc("set_byok_key", {
    p_provider: provider,
    p_key: key,
  });
  if (error) {
    throw new Error(`Failed to save key: ${error.message}`);
  }
}

export async function deleteByokKey(provider: ByokProvider): Promise<void> {
  await ensureAnonymousSession();

  const { error } = await supabase.rpc("delete_byok_key", {
    p_provider: provider,
  });
  if (error) {
    throw new Error(`Failed to remove key: ${error.message}`);
  }
}
