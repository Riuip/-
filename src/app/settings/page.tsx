import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "账号设置 · 论坛",
};

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Should not happen because of the auth.users trigger, but handle gracefully.
    return (
      <div className="card p-6 text-sm text-gray-600">
        无法加载个人资料,请联系管理员。
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-3">
      <h1 className="text-xl font-semibold">账号设置</h1>
      <SettingsForm
        initialUsername={profile.username}
        initialBio={profile.bio ?? ""}
        initialAvatarUrl={profile.avatar_url}
        email={user.email ?? ""}
      />
    </div>
  );
}
