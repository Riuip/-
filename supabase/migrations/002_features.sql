-- =====================================================================
-- Migration 002: community_members + stats view
-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- =====================================================================

-- ---------- community_members: who has joined which community ----------
create table if not exists public.community_members (
  user_id      uuid references public.profiles(id)    on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, community_id)
);

create index if not exists community_members_user_idx
  on public.community_members(user_id);
create index if not exists community_members_community_idx
  on public.community_members(community_id);

alter table public.community_members enable row level security;

drop policy if exists "community members readable by everyone"
  on public.community_members;
create policy "community members readable by everyone"
  on public.community_members for select using (true);

drop policy if exists "users can join communities"
  on public.community_members;
create policy "users can join communities"
  on public.community_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can leave communities"
  on public.community_members;
create policy "users can leave communities"
  on public.community_members for delete
  using (auth.uid() = user_id);

-- ---------- communities_with_stats: member_count + post_count ----------
create or replace view public.communities_with_stats as
select
  c.*,
  coalesce(mc.member_count, 0)::int as member_count,
  coalesce(pc.post_count,   0)::int as post_count
from public.communities c
left join (
  select community_id, count(*)::int as member_count
  from public.community_members
  group by community_id
) mc on mc.community_id = c.id
left join (
  select community_id, count(*)::int as post_count
  from public.posts
  group by community_id
) pc on pc.community_id = c.id;
