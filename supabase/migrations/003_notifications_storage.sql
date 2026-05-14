-- =====================================================================
-- Migration 003: notifications + post/comment editing + storage bucket
-- Run this in the Supabase SQL Editor AFTER 002_features.sql.
-- =====================================================================

-- ---------- updated_at on posts and comments ----------
-- We must DROP dependent views first, because adding columns to a table
-- conflicts with views that select `*` from it (Postgres locks the view
-- column order/names).  CASCADE drops the views; we recreate them below.
drop view if exists public.posts_with_score    cascade;
drop view if exists public.comments_with_score cascade;

alter table public.posts    add column if not exists updated_at timestamptz;
alter table public.comments add column if not exists updated_at timestamptz;

-- Recreate the score views (they will pick up the new updated_at columns).
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

create or replace view public.comments_with_score as
select
  c.*,
  pr.username as author_username,
  pr.avatar_url as author_avatar_url,
  coalesce(sum(v.value), 0)::int as score
from public.comments c
left join public.profiles pr on pr.id = c.author_id
left join public.votes v    on v.comment_id = c.id
group by c.id, pr.username, pr.avatar_url;

-- Auto-bump updated_at when body/title/url changes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'UPDATE') and (
    new.body is distinct from old.body
    or (tg_table_name = 'posts' and (
      new.title is distinct from old.title or new.url is distinct from old.url
    ))
  ) then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- ---------- notifications ----------
-- Kinds:
--   'reply_post'    : someone replied to your post
--   'reply_comment' : someone replied to your comment
create table if not exists public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  actor_id      uuid references public.profiles(id) on delete set null,
  kind          text not null check (kind in ('reply_post','reply_comment')),
  post_id       uuid references public.posts(id) on delete cascade,
  comment_id    uuid references public.comments(id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, read_at, created_at desc);
create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "users can read their own notifications"
  on public.notifications;
create policy "users can read their own notifications"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "users can update their own notifications"
  on public.notifications;
create policy "users can update their own notifications"
  on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "users can delete their own notifications"
  on public.notifications;
create policy "users can delete their own notifications"
  on public.notifications for delete using (auth.uid() = user_id);

-- Auto-create a notification when someone replies.
-- SECURITY DEFINER lets the trigger insert on behalf of the recipient
-- without tripping over RLS.
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  recipient uuid;
  k text;
begin
  if new.parent_id is not null then
    select author_id into recipient from public.comments where id = new.parent_id;
    k := 'reply_comment';
  else
    select author_id into recipient from public.posts    where id = new.post_id;
    k := 'reply_post';
  end if;

  if recipient is null or recipient = new.author_id then
    return new; -- don't notify yourself / orphan author
  end if;

  insert into public.notifications (user_id, actor_id, kind, post_id, comment_id)
  values (recipient, new.author_id, k, new.post_id, new.id);

  return new;
end;
$$;

drop trigger if exists comments_notify on public.comments;
create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- View: notifications joined with actor / post / comment details.
create or replace view public.notifications_view as
select
  n.id,
  n.user_id,
  n.actor_id,
  n.kind,
  n.post_id,
  n.comment_id,
  n.read_at,
  n.created_at,
  ap.username       as actor_username,
  p.title           as post_title,
  c.body            as comment_body
from public.notifications n
left join public.profiles ap on ap.id = n.actor_id
left join public.posts    p  on p.id  = n.post_id
left join public.comments c  on c.id  = n.comment_id;

-- ---------- storage bucket: avatars + post images ----------
-- Public bucket for user-uploaded images (avatars, post images).
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Anyone can read files in the public 'uploads' bucket.
drop policy if exists "uploads readable by everyone" on storage.objects;
create policy "uploads readable by everyone"
  on storage.objects for select
  using (bucket_id = 'uploads');

-- Authenticated users can upload, but only into a folder named after their UID.
-- e.g. uploads/<uid>/<file>.png
drop policy if exists "users can upload to own folder" on storage.objects;
create policy "users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users can update own files" on storage.objects;
create policy "users can update own files"
  on storage.objects for update
  using (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users can delete own files" on storage.objects;
create policy "users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
