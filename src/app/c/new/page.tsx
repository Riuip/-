import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewCommunityForm from "./NewCommunityForm";

export const metadata = {
  title: "创建社区",
};

export default async function NewCommunityPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/c/new");

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-lg font-semibold mb-3">创建社区</h1>
      <NewCommunityForm />
    </div>
  );
}
