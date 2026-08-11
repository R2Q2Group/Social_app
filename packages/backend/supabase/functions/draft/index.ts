// Gate 1 drafting endpoint: raw text/transcript in -> structured JSON out.
// Auth: any Supabase session (anonymous included, per RDD.md Section 7
// decision #2). BYOK callers skip the free-tier limit entirely; everyone
// else is capped at FREE_TIER_DAILY_LIMIT/day via increment_usage().
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import {
  DraftGenerationError,
  generateDraft,
  type Draft,
} from "../../../../ai-core/src/index.ts";

const FREE_TIER_DAILY_LIMIT = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "missing_authorization" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const backendAnthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  // Validates the caller's JWT (anonymous or full session both work).
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } =
    await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "invalid_session" }, 401);
  }
  const userId = userData.user.id;

  let body: { mode?: unknown; input?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json_body" }, 400);
  }

  const { mode, input } = body;
  if (mode !== "carousel" && mode !== "thumbnail") {
    return jsonResponse(
      { error: 'mode must be "carousel" or "thumbnail"' },
      400,
    );
  }
  if (typeof input !== "string" || input.trim().length === 0) {
    return jsonResponse({ error: "input must be a non-empty string" }, 400);
  }

  // Service-role client: get_decrypted_byok_key / increment_usage are
  // revoked from anon/authenticated and only callable with this key.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: byokKey, error: byokError } = await adminClient.rpc(
    "get_decrypted_byok_key",
    { p_user_id: userId, p_provider: "anthropic" },
  );
  if (byokError) {
    console.error("byok lookup failed", byokError);
    return jsonResponse({ error: "internal_error" }, 500);
  }

  let apiKey: string;
  let usedByok = false;

  if (byokKey) {
    apiKey = byokKey as string;
    usedByok = true;
  } else {
    if (!backendAnthropicKey) {
      return jsonResponse({ error: "backend_key_not_configured" }, 500);
    }
    const { error: usageError } = await adminClient.rpc("increment_usage", {
      p_user_id: userId,
      p_daily_limit: FREE_TIER_DAILY_LIMIT,
    });
    if (usageError) {
      if (usageError.message?.includes("free_tier_limit_exceeded")) {
        return jsonResponse(
          {
            error: "free_tier_limit_exceeded",
            message: `Free tier is limited to ${FREE_TIER_DAILY_LIMIT} generations/day. Add a BYOK key in settings for unlimited use.`,
          },
          429,
        );
      }
      console.error("usage increment failed", usageError);
      return jsonResponse({ error: "internal_error" }, 500);
    }
    apiKey = backendAnthropicKey;
  }

  let draft: Draft;
  try {
    draft = await generateDraft({ mode, input, apiKey });
  } catch (err) {
    if (err instanceof DraftGenerationError) {
      console.error("draft generation failed", err.message);
      return jsonResponse(
        { error: "draft_generation_failed", message: err.message },
        502,
      );
    }
    console.error("unexpected error", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }

  return jsonResponse({ draft, usedByok });
});
