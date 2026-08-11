// Gate 7: feedback loop on AI draft quality per platform. draft_feedback is
// a plain user-owned table (RLS insert-own, no vault/RPC involved, unlike
// byok.ts) so this wrapper is a direct insert.
import { supabase } from "./supabase";
import { ensureAnonymousSession } from "./session";

export type FeedbackApp = "viziphy" | "thumbwave";
export type FeedbackMode = "carousel" | "thumbnail";
export type FeedbackRating = "up" | "down";

/** platform is the CarouselPlatformKey for carousel mode, or a variant
 * identifier (e.g. "variant-0") for thumbnail mode -- free text on the
 * backend so either shape fits without a schema change. */
export async function submitDraftFeedback(
  app: FeedbackApp,
  mode: FeedbackMode,
  platform: string,
  rating: FeedbackRating,
): Promise<void> {
  await ensureAnonymousSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Failed to submit feedback: no active session");
  }

  const { error } = await supabase.from("draft_feedback").insert({
    user_id: user.id,
    app,
    mode,
    platform,
    rating,
  });
  if (error) {
    throw new Error(`Failed to submit feedback: ${error.message}`);
  }
}
