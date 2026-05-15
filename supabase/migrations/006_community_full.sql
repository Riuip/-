-- =====================================================================
-- Migration 006: full community features
-- - icon_url, banner_url, rules, is_private on communities
-- - community_moderators table (so creator can promote multiple mods)
-- - communities_with_stats view recreated to include new columns
-- Run this in the Supabase SQL Editor AFTER 005.
-- =====================================================================

-- Drop dependent view first.
drop view if exists public.communities_with_stats cascade;

-- Add new columns.
alter table public.communities add column if not exists icon_url   text;
alter table public.communities add column if not exists banner_url text;
alter table public.communities add column if not exists rules      text;
alter table public.communities add column if not exists is_private boolean not null default false;

-- Recreate stats view with new fields included via c.*
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

-- ---------- community_moderators ----------
-- Multiple moderators per community (creator + invited mods).
create table if not exists public.community_moderators (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id)    on delete cascade,
  added_by     uuid references public.profiles(id) on delete set null,
  added_at     timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists community_moderators_community_idx
  on public.community_moderators(community_id);
create index if not exists community_moderators_user_idx
  on public.community_moderators(user_id);

alter table public.community_moderators enable row level security;

-- Anyone can see who the moderators are.
drop policy if exists "moderators readable by everyone" on public.community_moderators;
create policy "moderators readable by everyone"
  on public.community_moderators for select using (true);

-- Only the community creator can add/remove moderators.
drop policy if exists "creators can add moderators" on public.community_moderators;
create policy "creators can add moderators"
  on public.community_moderators for insert
  with check (
    exists (
      select 1 from public.communities
      where id = community_id and created_by = auth.uid()
    )
  );

drop policy if exists "creators can remove moderators" on public.community_moderators;
create policy "creators can remove moderators"
  on public.community_moderators for delete
  using (
    exists (
      select 1 from public.communities
      where id = community_id and created_by = auth.uid()
    )
  );

-- Helper: is the current user a mod (or creator) of a community?
create or replace function public.is_community_mod(c_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.communities
    where id = c_id and created_by = auth.uid()
  ) or exists (
    select 1 from public.community_moderators
    where community_id = c_id and user_id = auth.uid()
  );
$$;

-- Update the moderation policies on posts/comments to also accept any
-- moderator (not just the creator).
drop policy if exists "community creators can moderate posts" on public.posts;
create policy "mods can moderate posts"
  on public.posts for update
  using (
    auth.uid() = author_id
    or public.is_community_mod(community_id)
  );

drop policy if exists "community creators can delete any post in their community"
  on public.posts;
create policy "authors or mods can delete posts"
  on public.posts for delete
  using (
    auth.uid() = author_id
    or public.is_community_mod(community_id)
  );

drop policy if exists "authors or mods can delete comments" on public.comments;
create policy "authors or mods can delete comments"
  on public.comments for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.posts p
      where p.id = post_id and public.is_community_mod(p.community_id)
    )
  );

-- Allow creator to update community settings (slug, name, description, icon_url, banner_url, rules, is_private).
drop policy if exists "creators can update their community" on public.communities;
create policy "creators can update their community"
  on public.communities for update
  using (auth.uid() = created_by);
