-- Gate 5: monetization layer RPCs.
-- Real upgrade path is intended to be Google Play Billing / Apple StoreKit
-- (per RDD.md decision), which needs store console access, product IDs, and
-- native build config this environment can't provision. These two RPCs are
-- the dev-mock seam that stands in for that: same shape a real flow would
-- need (flip the caller's own entitlement row), so swapping in real IAP
-- later only means replacing what calls these -- a receipt-validating
-- service-role webhook calling the same upsert, and a native purchase flow
-- calling into it -- not touching any of the enforcement code that reads
-- `entitlements` (draft/index.ts, the client-side watermark/paywall gating).
-- Mirrors Gate 1's set_byok_key/delete_byok_key pattern: security definer,
-- auth.uid() checked inside, no direct table grants to authenticated.

create or replace function public.upgrade_to_pro()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.entitlements (user_id, tier, status, updated_at)
  values (auth.uid(), 'pro', 'active', now())
  on conflict (user_id) do update
    set tier = 'pro', status = 'active', updated_at = now();
end;
$$;

revoke all on function public.upgrade_to_pro() from public, anon;
grant execute on function public.upgrade_to_pro() to authenticated;

-- Stands in for "manage subscription" (a real IAP flow would deep-link to
-- the platform's native subscription-management screen instead of this).
create or replace function public.downgrade_to_free()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.entitlements (user_id, tier, status, updated_at)
  values (auth.uid(), 'free', 'active', now())
  on conflict (user_id) do update
    set tier = 'free', status = 'active', updated_at = now();
end;
$$;

revoke all on function public.downgrade_to_free() from public, anon;
grant execute on function public.downgrade_to_free() to authenticated;
