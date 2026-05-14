-- =====================================================================
-- Reddit-style Forum Schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL -> New Query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- =====================================================================
-- 1. profiles : public user profile, 1-1 with auth.users
-- =====================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null check (char_length(username) between 3 and 24),
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth.users record is inserted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      'user_' || substr(new.id::text, 1, 8)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 2. communities : like a "subreddit"
-- =====================================================================
create table if not exists public.communities (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null check (slug ~ '^[a-z0-9_]{3,24}$'),
  name        text not null,
  description text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists communities_created_at_idx on public.communities(created_at desc);

-- =====================================================================
-- 3. posts
-- =====================================================================
create table if not exists public.posts (
  id           uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id    uuid references public.profiles(id) on delete set null,
  title        text not null check (char_length(title) between 1 and 300),
  body         text,         -- markdown / plain text
  url          text,         -- optional link post
  created_at   timestamptz not null default now()
);

create index if not exists posts_community_idx  on public.posts(community_id, created_at desc);
create index if not exists posts_author_idx     on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);

-- =====================================================================
-- 4. comments (tree-structured via parent_id)
-- =====================================================================
create table if not exists public.comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  body        text not null check (char_length(body) between 1 and 10000),
  created_at  timestamptz not null default now()
);

create index if not exists comments_post_idx   on public.comments(post_id, created_at);
create index if not exists comments_parent_idx on public.comments(parent_id);

-- =====================================================================
-- 5. votes : one row per (user, target). value in {-1, +1}.
--    A vote targets EITHER a post OR a comment (xor).
-- =====================================================================
create table if not exists public.votes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid references public.posts(id)    on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  -- Exactly one target:
  constraint votes_one_target check (
    (post_id is not null)::int + (comment_id is not null)::int = 1
  ),
  -- Composite PKs for upsert-by-target:
  primary key (user_id, post_id, comment_id)
);

create index if not exists votes_post_idx    on public.votes(post_id);
create index if not exists votes_comment_idx on public.votes(comment_id);

-- =====================================================================
-- 6. Convenience views with vote scores
-- =====================================================================
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

-- =====================================================================
-- 7. Row Level Security
-- =====================================================================
alter table public.profiles    enable row level security;
alter table public.communities enable row level security;
alter table public.posts       enable row level security;
alter table public.comments    enable row level security;
alter table public.votes       enable row level security;

-- profiles: anyone can read; users can update their own row.
drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
  on public.profiles for select using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- communities: anyone can read; logged-in users can create; only creator can update/delete.
drop policy if exists "communities readable by everyone" on public.communities;
create policy "communities readable by everyone"
  on public.communities for select using (true);

drop policy if exists "logged-in users can create communities" on public.communities;
create policy "logged-in users can create communities"
  on public.communities for insert with check (auth.uid() = created_by);

drop policy if exists "creators can update their community" on public.communities;
create policy "creators can update their community"
  on public.communities for update using (auth.uid() = created_by);

drop policy if exists "creators can delete their community" on public.communities;
create policy "creators can delete their community"
  on public.communities for delete using (auth.uid() = created_by);

-- posts: anyone can read; logged-in users can create their own; authors can update/delete their own.
drop policy if exists "posts readable by everyone" on public.posts;
create policy "posts readable by everyone"
  on public.posts for select using (true);

drop policy if exists "logged-in users can create posts" on public.posts;
create policy "logged-in users can create posts"
  on public.posts for insert with check (auth.uid() = author_id);

drop policy if exists "authors can update their posts" on public.posts;
create policy "authors can update their posts"
  on public.posts for update using (auth.uid() = author_id);

drop policy if exists "authors can delete their posts" on public.posts;
create policy "authors can delete their posts"
  on public.posts for delete using (auth.uid() = author_id);

-- comments: same pattern.
drop policy if exists "comments readable by everyone" on public.comments;
create policy "comments readable by everyone"
  on public.comments for select using (true);

drop policy if exists "logged-in users can comment" on public.comments;
create policy "logged-in users can comment"
  on public.comments for insert with check (auth.uid() = author_id);

drop policy if exists "authors can update their comments" on public.comments;
create policy "authors can update their comments"
  on public.comments for update using (auth.uid() = author_id);

drop policy if exists "authors can delete their comments" on public.comments;
create policy "authors can delete their comments"
  on public.comments for delete using (auth.uid() = author_id);

-- votes: anyone can read; users manage their own.
drop policy if exists "votes readable by everyone" on public.votes;
create policy "votes readable by everyone"
  on public.votes for select using (true);

drop policy if exists "users can cast their own votes" on public.votes;
create policy "users can cast their own votes"
  on public.votes for insert with check (auth.uid() = user_id);

drop policy if exists "users can change their own votes" on public.votes;
create policy "users can change their own votes"
  on public.votes for update using (auth.uid() = user_id);

drop policy if exists "users can remove their own votes" on public.votes;
create policy "users can remove their own votes"
  on public.votes for delete using (auth.uid() = user_id);
