-- =====================================================================
-- Migration 005: moderation (pin/lock) + @mention notifications
-- Run this in the Supabase SQL Editor AFTER 004.
-- =====================================================================

-- Must drop views first since posts table changes affect posts_with_score.
drop view if exists public.posts_with_score cascade;

-- ---------- Add moderation columns to posts ----------
alter table public.posts add column if not exists is_pinned boolean not null default false;
alter table public.posts add column if not exists is_locked boolean not null default false;

-- Recreate posts_with_score with new columns.
create or replace view public.posts_with_score as
select
  p.*,
  c.slug as community_slug,
  c.name as community_name,
  pr.username as author_username,
  pr.avatar_url as author_avatar_url,
  coalesce(sum(v.value), 0)::int as score,
  count(distinct cm.id)::int      as comment_count
from public.posts p
left join public.communities c on c.id = p.community_id
left join public.profiles pr   on pr.id = p.author_id
left join public.votes v       on v.post_id = p.id
left join public.comments cm   on cm.post_id = p.id
group by p.id, c.slug, c.name, pr.username, pr.avatar_url;

-- Allow community creators to update posts in their community (for pin/lock/delete).
drop policy if exists "community creators can moderate posts" on public.posts;
create policy "community creators can moderate posts"
  on public.posts for update
  using (
    exists (
      select 1 from public.communities
      where id = community_id and created_by = auth.uid()
    )
  );

-- Drop every historical name for the delete policy before recreating
-- so this migration is safe to re-run.
drop policy if exists "community creators can delete posts" on public.posts;
drop policy if exists "community creators can delete any post in their community" on public.posts;
drop policy if exists "authors can delete their posts" on public.posts;
create policy "community creators can delete any post in their community"
  on public.posts for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.communities
      where id = community_id and created_by = auth.uid()
    )
  );

-- Allow community creators to delete comments in their community.
drop policy if exists "authors can delete their comments" on public.comments;
create policy "authors or mods can delete comments"
  on public.comments for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.communities c
      join public.posts p on p.community_id = c.id
      where p.id = post_id and c.created_by = auth.uid()
    )
  );

-- ---------- @mention notification trigger ----------
-- Scans new comment body for @username patterns and creates 'mention' notifications.
-- First, add 'mention' to the allowed kinds.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('reply_post', 'reply_comment', 'mention'));

create or replace function public.notify_on_mention()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  mentioned_username text;
  mentioned_user_id uuid;
begin
  -- Find all @username patterns (word boundary: 3-24 chars a-z0-9_)
  for mentioned_username in
    select distinct (regexp_matches(new.body, '@([a-z0-9_]{3,24})', 'g'))[1]
  loop
    -- Look up the user
    select id into mentioned_user_id
      from public.profiles
      where username = mentioned_username;

    -- Skip if user not found, or if mentioning yourself
    if mentioned_user_id is null or mentioned_user_id = new.author_id then
      continue;
    end if;

    -- Don't duplicate if already notified via reply
    insert into public.notifications (user_id, actor_id, kind, post_id, comment_id)
    values (mentioned_user_id, new.author_id, 'mention', new.post_id, new.id)
    on conflict do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists comments_mention_notify on public.comments;
create trigger comments_mention_notify
  after insert on public.comments
  for each row execute function public.notify_on_mention();
