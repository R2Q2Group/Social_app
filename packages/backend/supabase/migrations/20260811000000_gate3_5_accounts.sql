-- Gate 3.5: shared account/entitlement layer.
-- One auth.users table already backs every app in the family (Viziphy now,
-- Thumbwave from Gate 4), so a user who signs up with email/password in one
-- app resolves to the same auth.uid() -- and therefore the same BYOK keys,
-- usage, and entitlement row -- in any other app pointed at this project.
-- This migration adds the entitlement side; BYOK/usage already carry over
-- unchanged from Gate 1 since they're keyed by user_id, not by app.

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due')),
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

create policy "entitlements_select_own" on public.entitlements
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy for authenticated: rows are seeded by the
-- trigger below and (from Gate 5 onward) written by a service-role billing
-- webhook, never by the client directly.

-- Seeds a default 'free' entitlement for every new auth.users row --
-- anonymous sign-in included, so the row already exists by the time an
-- anonymous session upgrades to a real account via auth.updateUser() (same
-- user_id, no new auth.users insert, so no migration step is needed).
create or replace function public.handle_new_user_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.entitlements (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_entitlement on auth.users;
create trigger on_auth_user_created_entitlement
  after insert on auth.users
  for each row execute function public.handle_new_user_entitlement();
