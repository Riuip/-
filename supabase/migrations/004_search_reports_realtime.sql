-- =====================================================================
-- Migration 004: reports + realtime publication for comments
-- Run this in the Supabase SQL Editor AFTER 003_notifications_storage.sql.
-- =====================================================================

-- ---------- reports: user-submitted moderation flags ----------
create table if not exists public.reports (
  id          uuid primary key default uuid_generate_v4(),
  reporter_id uuid references public.profiles(id) on delete set null,
  post_id     uuid references public.posts(id)    on delete cascade,
  comment_id  uuid references public.comments(id) on delete cascade,
  reason      text not null check (char_length(reason) between 1 and 500),
  status      text not null default 'pending'
    check (status in ('pending', 'reviewed', 'dismissed')),
  created_at  timestamptz not null default now(),
  -- Exactly one target.
  constraint reports_one_target check (
    (post_id is not null)::int + (comment_id is not null)::int = 1
  )
);

create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reports_post_idx     on public.reports(post_id);
create index if not exists reports_comment_idx  on public.reports(comment_id);
create index if not exists reports_status_idx   on public.reports(status, created_at desc);

alter table public.reports enable row level security;

-- A logged-in user can submit reports as themselves.
drop policy if exists "users can submit reports" on public.reports;
create policy "users can submit reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- A user can see only their own reports (admins use service role to see all).
drop policy if exists "users can read their own reports" on public.reports;
create policy "users can read their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- ---------- realtime: subscribe-able tables ----------
-- Add comments + notifications to the realtime publication so the client
-- can listen to INSERT events. Wrap in DO blocks so re-running is safe.
do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null;
end $$;
