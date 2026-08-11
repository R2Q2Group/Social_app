-- Gate 1: free-tier usage tracking and BYOK key storage.
-- Callers are Supabase-authenticated users (anonymous sessions included, per
-- RDD.md Section 7 decision #2). Raw BYOK keys are never stored in a plain
-- column -- they live in Supabase Vault (pgsodium-encrypted), referenced by
-- secret_id.

create table if not exists public.usage_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  request_count integer not null default 0,
  primary key (user_id, usage_date)
);

alter table public.usage_daily enable row level security;

create policy "usage_daily_select_own" on public.usage_daily
  for select using (auth.uid() = user_id);

-- No insert/update policy for authenticated users: only increment_usage()
-- below (service-role only) may write usage rows.

create table if not exists public.byok_keys (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('anthropic', 'openai')),
  secret_id uuid not null references vault.secrets (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table public.byok_keys enable row level security;

create policy "byok_keys_select_own" on public.byok_keys
  for select using (auth.uid() = user_id);

create policy "byok_keys_delete_own" on public.byok_keys
  for delete using (auth.uid() = user_id);

-- Inserts/updates go through set_byok_key() so the raw key only ever passes
-- through vault.create_secret/update_secret, never a plain insert statement.

create or replace function public.set_byok_key(p_provider text, p_key text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select secret_id into v_secret_id
  from public.byok_keys
  where user_id = auth.uid() and provider = p_provider;

  if v_secret_id is not null then
    perform vault.update_secret(v_secret_id, p_key);
  else
    v_secret_id := vault.create_secret(p_key, auth.uid()::text || ':' || p_provider);
    insert into public.byok_keys (user_id, provider, secret_id)
    values (auth.uid(), p_provider, v_secret_id);
  end if;
end;
$$;

create or replace function public.delete_byok_key(p_provider text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select secret_id into v_secret_id
  from public.byok_keys
  where user_id = auth.uid() and provider = p_provider;

  if v_secret_id is not null then
    delete from public.byok_keys where user_id = auth.uid() and provider = p_provider;
    delete from vault.secrets where id = v_secret_id;
  end if;
end;
$$;

-- Decrypts a caller's BYOK key. Only the service role may execute this --
-- called from the draft Edge Function, never exposed to anon/authenticated.
create or replace function public.get_decrypted_byok_key(p_user_id uuid, p_provider text)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets ds
  join public.byok_keys bk on bk.secret_id = ds.id
  where bk.user_id = p_user_id and bk.provider = p_provider;
$$;

revoke all on function public.get_decrypted_byok_key(uuid, text) from public, anon, authenticated;
grant execute on function public.get_decrypted_byok_key(uuid, text) to service_role;

-- Atomically increments today's free-tier usage and raises
-- free_tier_limit_exceeded once the caller is over p_daily_limit. Service
-- role only -- called from the draft Edge Function after a successful
-- backend-key generation (BYOK calls never touch this).
create or replace function public.increment_usage(p_user_id uuid, p_daily_limit integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.usage_daily (user_id, usage_date, request_count)
  values (p_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date)
  do update set request_count = usage_daily.request_count + 1
  returning request_count into v_count;

  if v_count > p_daily_limit then
    raise exception 'free_tier_limit_exceeded' using errcode = 'P0001';
  end if;

  return v_count;
end;
$$;

revoke all on function public.increment_usage(uuid, integer) from public, anon, authenticated;
grant execute on function public.increment_usage(uuid, integer) to service_role;
