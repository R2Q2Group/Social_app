# @r2q2/backend

Supabase project: Postgres, Auth, Edge Functions, Storage.

- `supabase/functions/` — Edge Functions (Gate 1: idea-in / structured-JSON-out
  drafting endpoint; Gate 3.5: shared account/entitlement checks)
- `supabase/config.toml` — local dev project config

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli) for local dev
(`npm run dev` → `supabase start`) and Docker running (used by `supabase start`
to spin up Postgres/Auth/Storage/Edge Runtime containers).

## Gate 1: testing the `draft` endpoint

1. `npm run sync-shared` — mirrors `packages/ai-core/src` into
   `supabase/functions/_shared/ai-core`. The local Edge Function container's
   bind mount is sandboxed to `supabase/functions`, so functions that import
   `@r2q2/ai-core` can't reach the real package; they import this generated
   mirror instead (`packages/ai-core/src` stays the source of truth — re-run
   this after changing it). `npm run dev`/`npm run deploy` do this
   automatically via `predev`/`predeploy`; run it manually first if calling
   `supabase` directly as in the steps below.
2. `supabase start` (applies `supabase/migrations/` automatically), or run
   against a linked hosted project with `supabase db push`.
3. Copy `supabase/functions/.env.example` to `supabase/functions/.env`, fill in
   the printed `anon`/`service_role` keys from `supabase start` output, and set
   `ANTHROPIC_API_KEY` to a real Anthropic key (backend free-tier key — a BYOK
   caller never needs this one set).
4. `supabase functions serve draft --env-file supabase/functions/.env`
5. Get an anonymous session JWT (the app does this automatically via
   `supabase.auth.signInAnonymously()`; from a shell you can call the Auth API
   directly):

   ```sh
   curl -s -X POST http://127.0.0.1:54321/auth/v1/signup \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "content-type: application/json" \
     -d '{}' | jq -r .access_token
   ```

6. POST an idea:

   ```sh
   curl -s -X POST http://127.0.0.1:54321/functions/v1/draft \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "content-type: application/json" \
     -d '{"mode":"carousel","input":"Why most startups fail at pricing"}'
   ```

   A 4th call the same day (without a BYOK key stored) should return
   `429 free_tier_limit_exceeded`. Storing a BYOK key first
   (`select set_byok_key('anthropic', 'sk-ant-...')` as that user) should let
   calls past the cap succeed and set `usedByok: true` in the response.

This satisfies Gate 1's exit condition once both modes return valid JSON.
