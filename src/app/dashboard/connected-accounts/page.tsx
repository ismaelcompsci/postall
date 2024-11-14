import { ConnectedAccounts } from "@/components/connected-accounts/connected-accounts";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.info("[CONNECTED ACCOUNTS] No user found");
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("social_connections")
    .select("platform_username,platform,platform_profile_picture_url,id")
    .eq("user_id", user.id);

  if (error) {
    console.log(error);
  }

  return (
    <div className="p-4">
      <div className="flex flex-col space-y-8 rounded-lg">
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          {/* header */}
          <div className="space-y-4">
            <span className="text-lg text-muted-foreground font-medium font-gesit-mono">
              Connected Accounts
            </span>
            <Separator />
          </div>

          {/* accounts */}

          <ConnectedAccounts accounts={data} />
        </div>
      </div>
    </div>
  );
}
