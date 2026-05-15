// Cached auth helpers — React.cache() deduplicates within a single request,
// so Navbar + page can both call these without doubling queries.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

export const getUnreadNotificationCount = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return 0;
  const supabase = createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  return count ?? 0;
});
