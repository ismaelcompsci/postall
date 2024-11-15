import { socialIcons } from "@/lib/platforms";
import { AccountType } from "@/lib/types";
import { SocialAvatar } from "../connected-accounts/social-avatar";
import { Separator } from "../ui/separator";
import { Account, PostText } from "@/state/create-post-state";

export const PlatfromUploadDisplayPreview = ({
  groupedAccounts,
}: {
  groupedAccounts: Record<string, Account[]>;
}) => {
  return (
    <div className="bg-muted/50 rounded-md p-2 space-y-2">
      {Object.entries(groupedAccounts).map(([provider, accounts], index) => {
        const Icon = socialIcons[provider as AccountType];

        return (
          <div
            key={index}
            className="flex-wrap flex gap-4 text-muted-foreground text-sm items-center"
          >
            <span className="flex items-center gap-2">
              <Icon />
              {provider}
            </span>
            -
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex gap-2 border rounded-full px-2 py-1"
              >
                <SocialAvatar
                  username={acc.platform_username}
                  profile_picture_url={acc.platform_profile_picture_url}
                />
                {acc.platform_username}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export const PerPlatformUploadDisplayPreview = ({
  groupedAccounts,
  postText,
}: {
  groupedAccounts: Record<string, Account[]>;
  postText: PostText;
}) => {
  return (
    <div className="bg-muted/50 rounded-md p-2 gap-1 flex flex-col">
      {Object.entries(groupedAccounts).map(([provider, accounts], index) => {
        const Icon = socialIcons[provider as AccountType];

        return (
          <div key={index}>
            {accounts.map((acc) => {
              return (
                <div>
                  <div
                    key={acc.id}
                    className="flex flex-row text-sm text-muted-foreground/90 items-center"
                  >
                    <span className="flex items-center gap-2 w-24">
                      <Icon />
                      {provider}
                    </span>
                    -
                    <div key={acc.id} className="flex gap-2 px-2 py-1">
                      <SocialAvatar
                        username={acc.platform_username}
                        profile_picture_url={acc.platform_profile_picture_url}
                      />
                      {acc.platform_username}
                    </div>
                  </div>
                  <div className="pl-24 text-sm text-muted-foreground/90">
                    {postText[provider].text}
                  </div>
                </div>
              );
            })}

            {Object.entries(groupedAccounts).length - 1 !== index && (
              <Separator className="mt-1" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const SectionContainer = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-background rounded-md px-3 py-4 space-y-1">
    <p className="text-xs font-gesit-mono font-bold">{title}</p>
    {children}
  </div>
);
