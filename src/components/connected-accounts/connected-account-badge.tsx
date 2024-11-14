import { X } from "lucide-react";
import { Badge } from "../ui/badge";
import { SocialAvatar } from "./social-avatar";
import { RemoveAccountParams } from "@/lib/types";

export const ConnectedAccountBadge = ({
  id,
  profile_picture_url,
  username,
  removeAccount,
}: {
  id: string;
  profile_picture_url: string | null;
  username: string | null;
  removeAccount: (args: RemoveAccountParams) => Promise<void>;
}) => {
  return (
    <Badge className="gap-2.5 text-xs select-none">
      <SocialAvatar
        profile_picture_url={profile_picture_url}
        username={username}
      />
      @{username}
      <button onClick={() => removeAccount({ id: id })}>
        <X className="w-4 h-4 text-destructive" />
      </button>
    </Badge>
  );
};
