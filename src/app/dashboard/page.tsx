import { CreatePost } from "@/components/create-post/create-post";
import NoSsr from "@/components/no-ssr";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.info("[DASHBOARD] No user found");
    redirect("/login");
  }

  const { data: accounts } = await supabase
    .from("social_connections")
    .select("id, platform, platform_username, platform_profile_picture_url")
    .eq("user_id", user.id);

  return (
    <NoSsr>
      <div className="p-4">
        <div className="flex flex-col space-y-8 rounded-lg">
          <CreatePost accounts={accounts} />
        </div>
      </div>
    </NoSsr>
  );
}
