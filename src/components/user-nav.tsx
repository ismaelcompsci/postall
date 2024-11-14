import { createClient } from "@/utils/supabase/server";
import { SocialAvatar } from "./connected-accounts/social-avatar";

export const UserNav = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const avatar = user?.user_metadata["avatar_url"];
  const name = user?.user_metadata["name"];

  return (
    <SocialAvatar
      className="h-8 w-8 rounded-lg"
      profile_picture_url={avatar}
      username={name}
    />
  );
};
