import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditPostForm from "./EditPostForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "编辑帖子",
};

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/post/${params.id}/edit`);

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, body, url, author_id, community_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!post) notFound();
  if (post.author_id !== user.id) {
    redirect(`/post/${params.id}`); // not the owner
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold mb-3">编辑帖子</h1>
      <EditPostForm
        postId={post.id}
        initialTitle={post.title}
        initialBody={post.body ?? ""}
        initialUrl={post.url ?? ""}
      />
    </div>
  );
}
