import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const SocialAvatar = ({
  profile_picture_url,
  username = "U",
  className,
}: {
  profile_picture_url?: string | null;
  username?: string | null;
  className?: string;
}) => {
  return (
    <Avatar className={cn("w-5 h-5", className)}>
      {profile_picture_url && <AvatarImage src={profile_picture_url} />}
      <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};
