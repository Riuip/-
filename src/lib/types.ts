// Shared row types used across the app.
// (Hand-written for now; replace with `supabase gen types` output later.)

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  icon_url: string | null;
  banner_url: string | null;
  rules: string | null;
  is_private: boolean;
};

export type CommunityWithStats = Community & {
  member_count: number;
  post_count: number;
};

export type Post = {
  id: string;
  community_id: string;
  author_id: string | null;
  title: string;
  body: string | null;
  url: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string | null;
};

export type Comment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string | null;
  body: string;
  created_at: string;
  updated_at: string | null;
};

export type Vote = {
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  value: -1 | 1;
  created_at: string;
};

// View rows
export type PostWithScore = Post & {
  community_slug: string | null;
  community_name: string | null;
  author_username: string | null;
  author_avatar_url: string | null;
  score: number;
  comment_count: number;
};

export type CommentWithScore = Comment & {
  author_username: string | null;
  author_avatar_url: string | null;
  score: number;
};

export type SortMode = "new" | "hot" | "top";
export type FeedMode = "all" | "joined";

export type NotificationKind = "reply_post" | "reply_comment" | "mention";

export type NotificationView = {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: NotificationKind;
  post_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor_username: string | null;
  post_title: string | null;
  comment_body: string | null;
};
