import { AccountSectionProps } from "@/lib/types";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { ConnectedAccountBadge } from "./connected-account-badge";
import { SocialTitle } from "./account-section-title";

export const AccountSection = ({
  accountType,
  accounts,
  onAuthenticate,
  removeAccount,
}: AccountSectionProps) => {
  const filteredAccounts = accounts?.filter(
    (account) => account.platform === accountType
  );

  return (
    <div className="flex flex-col space-y-2">
      <SocialTitle accountType={accountType} />

      <div className="flex-wrap flex gap-6 items-center">
        <Button
          variant={"outline"}
          className="text-muted-foreground hover:bg-accent/50 hover:cursor-pointer border-accent-foreground/40 hover:border-accent-foreground border-dashed border transition-all bg-accent/50"
          onClick={async () => await onAuthenticate(accountType)}
        >
          <Plus className="mr-2" />
          Add Account
        </Button>

        {filteredAccounts?.map((account) => (
          <ConnectedAccountBadge
            key={account.id}
            profile_picture_url={account.platform_profile_picture_url}
            username={account.platform_username}
            id={account.id}
            removeAccount={removeAccount}
          />
        ))}
      </div>
    </div>
  );
};
