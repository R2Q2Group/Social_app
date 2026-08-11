// Gate 3.5 entitlement check: callable identically from any app in the
// family (Viziphy now, Thumbwave from Gate 4) since they all point at this
// one Supabase project -- a caller's auth.uid() and therefore their
// entitlements row are the same regardless of which app's bearer token made
// the request.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
  if (req.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "missing_authorization" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // RLS (entitlements_select_own) restricts this to the caller's own row --
  // no service-role key needed for a read.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } =
    await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "invalid_session" }, 401);
  }

  const { data, error } = await userClient
    .from("entitlements")
    .select("tier, status")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    console.error("entitlement lookup failed", error);
    return jsonResponse({ error: "internal_error" }, 500);
  }

  // Falls back to free/active if the seed trigger hasn't run yet for some
  // reason -- keeps the endpoint total instead of erroring a new caller out.
  return jsonResponse(data ?? { tier: "free", status: "active" });
});
