-- Gate 7: feedback loop on AI draft quality per platform.
-- A user-owned event log, not a mutable rating -- re-rating the same
-- platform/variant just inserts another row rather than overwriting, so the
-- history of how a draft's quality was perceived over edits is preserved.
-- Unlike byok_keys, this is plain user content with no secret material, so a
-- direct RLS insert-own policy is enough; no security-definer RPC needed.

create table if not exists public.draft_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  app text not null check (app in ('viziphy', 'thumbwave')),
  mode text not null check (mode in ('carousel', 'thumbnail')),
  platform text not null,
  rating text not null check (rating in ('up', 'down')),
  created_at timestamptz not null default now()
);

alter table public.draft_feedback enable row level security;

create policy "draft_feedback_select_own" on public.draft_feedback
  for select using (auth.uid() = user_id);

create policy "draft_feedback_insert_own" on public.draft_feedback
  for insert with check (auth.uid() = user_id);
