import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CommunitySettingsForm from "./CommunitySettingsForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "社区设置",
};

export default async function CommunitySettingsPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/c/${params.slug}/settings`);

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!community) notFound();
  if (community.created_by !== user.id) {
    redirect(`/c/${params.slug}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          社区设置
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          管理 c/{community.slug} 的外观、规则和隐私
        </p>
      </div>
      <CommunitySettingsForm
        id={community.id}
        slug={community.slug}
        initialName={community.name}
        initialDescription={community.description ?? ""}
        initialIconUrl={community.icon_url ?? null}
        initialBannerUrl={community.banner_url ?? null}
        initialRules={community.rules ?? ""}
        initialIsPrivate={community.is_private ?? false}
      />
    </div>
  );
}
