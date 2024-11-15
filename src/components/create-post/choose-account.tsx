import { cn } from "@/lib/utils";
import { useCreatePostStore, Account } from "@/state/create-post-state";

import { AccountType } from "../../lib/types";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { CheckedState } from "@radix-ui/react-checkbox";
import { SocialTitle } from "../connected-accounts/account-section-title";
import { Button } from "../ui/button";
import { Link } from "lucide-react";
import { useRouter } from "next/navigation";
import { SocialAvatar } from "../connected-accounts/social-avatar";

export const ChooseAccount = () => {
  const router = useRouter();
  const accounts = useCreatePostStore((state) => state.accounts);
  const selectedAccounts = useCreatePostStore(
    (state) => state.selectedAccounts
  );

  const setSelectedAccounts = useCreatePostStore(
    (state) => state.setSelectedAccounts
  );

  const hasAccounts = accounts.length !== 0;
  const groupedAccounts = accounts.reduce((acc, account) => {
    acc[account.platform || ""] = acc[account.platform || ""] || [];
    acc[account.platform || ""].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const handleCheckboxChange = (checked: CheckedState, account: Account) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, account]);
    } else {
      setSelectedAccounts(selectedAccounts.filter((a) => a.id !== account.id));
    }
  };

  if (hasAccounts === false) {
    return (
      <div className="w-full text-muted-foreground gap-4 flex flex-col items-center justify-center">
        <p> Connect your social media accounts to start posting</p>
        <Button
          className="text-muted-foreground "
          size={"sm"}
          variant={"outline"}
          onClick={() => router.push("/dashboard/connected-accounts")}
        >
          <Link />
          Connect Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-between gap-4 animate-in fade-in">
      <ScrollArea className="w-full">
        {Object.entries(groupedAccounts).map(([provider, accounts], index) => (
          <div
            key={provider}
            className={cn("flex flex-col gap-1", index !== 0 ? "pt-4" : "pt-0")}
          >
            <SocialTitle accountType={provider as AccountType} />
            {accounts.map((account) => {
              const isSelected = selectedAccounts.some(
                (a) => a.id === account.id
              );

              return (
                <div
                  key={account.id}
                  className="flex flex-row items-center gap-2 ml-4"
                >
                  <Checkbox
                    id={account.id}
                    onCheckedChange={(checked) => {
                      handleCheckboxChange(checked, account);
                    }}
                    checked={isSelected}
                  />
                  <label htmlFor={account.id}>
                    <Badge
                      className="gap-2.5 py-2 hover:bg-background/20"
                      variant={"secondary"}
                    >
                      <SocialAvatar
                        className="w-4 h-4"
                        profile_picture_url={
                          account.platform_profile_picture_url
                        }
                        username={account.platform_username}
                      />
                      @{account.platform_username}
                    </Badge>
                  </label>
                </div>
              );
            })}
          </div>
        ))}
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};
