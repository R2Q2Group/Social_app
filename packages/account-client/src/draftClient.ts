import { FunctionsHttpError } from "@supabase/supabase-js";
import type { CarouselDraft, Draft, ThumbnailDraft } from "@r2q2/ai-core";
import { supabase } from "./supabase";
import { ensureAnonymousSession } from "./session";

/** Thrown specifically for the `draft` endpoint's 429 free-tier cap, so the
 * UI can show RDD.md's BYOK upsell message instead of a generic error. */
export class FreeTierLimitError extends Error {}

export interface DraftResult<T extends Draft> {
  draft: T;
  usedByok: boolean;
}

interface DraftFunctionErrorBody {
  error?: string;
  message?: string;
}

interface DraftFunctionSuccessBody {
  draft: Draft;
  usedByok: boolean;
}

export function requestDraft(
  mode: "carousel",
  input: string,
): Promise<DraftResult<CarouselDraft>>;
export function requestDraft(
  mode: "thumbnail",
  input: string,
): Promise<DraftResult<ThumbnailDraft>>;
export async function requestDraft(
  mode: "carousel" | "thumbnail",
  input: string,
): Promise<DraftResult<Draft>> {
  await ensureAnonymousSession();

  const { data, error } = await supabase.functions.invoke<
    DraftFunctionSuccessBody | DraftFunctionErrorBody
  >("draft", {
    body: { mode, input },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context
        .json()
        .catch(() => null)) as DraftFunctionErrorBody | null;
      if (body?.error === "free_tier_limit_exceeded") {
        throw new FreeTierLimitError(
          body.message ??
            "Free tier is limited to 3 generations/day. Add a BYOK key in settings for unlimited use.",
        );
      }
      throw new Error(body?.message ?? body?.error ?? error.message);
    }
    throw new Error(error.message);
  }

  if (!data || !("draft" in data) || !data.draft) {
    throw new Error("draft endpoint returned no draft");
  }

  return { draft: data.draft, usedByok: data.usedByok ?? false };
}
