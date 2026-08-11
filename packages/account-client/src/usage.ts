import { supabase } from "./supabase";
import { ensureAnonymousSession } from "./session";

// Mirrors draft/index.ts's FREE_TIER_DAILY_LIMIT -- that's the source of
// truth for enforcement, this is only for display copy, same pattern
// draftClient.ts's FreeTierLimitError fallback message already uses.
export const FREE_TIER_DAILY_LIMIT = 3;

export interface UsageToday {
  requestCount: number;
  dailyLimit: number;
}

/** Today's free-tier request count for the current caller. Only meaningful
 * for a free-tier caller with no BYOK key set -- BYOK/Pro callers never hit
 * increment_usage (see draft/index.ts), so this stays at 0 for them. */
export async function getUsageToday(): Promise<UsageToday> {
  await ensureAnonymousSession();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("No active session.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("usage_daily")
    .select("request_count")
    .eq("user_id", userData.user.id)
    .eq("usage_date", today)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load usage: ${error.message}`);
  }

  return {
    requestCount: data?.request_count ?? 0,
    dailyLimit: FREE_TIER_DAILY_LIMIT,
  };
}
