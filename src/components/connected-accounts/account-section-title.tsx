import { socialIcons } from "@/lib/platforms";
import { AccountType } from "@/lib/types";

export const SocialTitle = ({ accountType }: { accountType: AccountType }) => {
  const Icon = socialIcons[accountType];

  return (
    <span className="text-sm text-muted-foreground font-medium font-gesit-mono flex-row flex items-center">
      <Icon className="mr-2" />
      {accountType}
    </span>
  );
};
