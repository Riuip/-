import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitForm from "./SubmitForm";

export default async function SubmitPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/c/${params.slug}/submit`);

  const { data: community } = await supabase
    .from("communities")
    .select("id, slug, name")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!community) {
    redirect(`/c/${params.slug}`); // visiting /c/[slug] auto-creates it.
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold mb-3">
        Create a post in{" "}
        <span className="text-brand">c/{community.slug}</span>
      </h1>
      <SubmitForm communityId={community.id} communitySlug={community.slug} />
    </div>
  );
}
