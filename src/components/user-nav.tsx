import { createClient } from "@/utils/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const UserNav = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const avatar = user?.user_metadata["avatar_url"];
  const name = user?.user_metadata["name"];

  return (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage src={avatar} alt={name} />
      <AvatarFallback className="rounded-lg">
        {user?.email?.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
};
