import { useCreatePostStore } from "@/state/create-post-state";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AccountType } from "../../lib/types";
import { ListCollapse } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Separator } from "../ui/separator";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ThumbnailPreview } from "./thumbnail-preview";
import { socialIcons } from "@/lib/platforms";
import { SocialAvatar } from "../connected-accounts/social-avatar";

export const Details = () => {
  const setEditPerPlatform = useCreatePostStore(
    (state) => state.setEditPerPlatform
  );
  const editPerPlatform = useCreatePostStore((state) => state.editPerPlatform);
  const setFinalPostText = useCreatePostStore((state) => state.setPostText);
  const finalPostText = useCreatePostStore((state) => state.postText);
  const postVideoFileURL = useCreatePostStore((state) => state.postFileURL);
  const selectedAccounts = useCreatePostStore(
    (state) => state.selectedAccounts
  );

  const { providers, disableEditPerPlatformButton } = useMemo(() => {
    const prov = Array.from(
      new Set(selectedAccounts.map((account) => account.platform))
    );

    const moreThanOneProvider = prov.length > 1;
    const disableEditPerPlatformButton =
      selectedAccounts.length === 1 || moreThanOneProvider === false;

    return {
      providers: prov,
      disableEditPerPlatformButton,
    };
  }, [selectedAccounts]);

  const handleTextChange = (text: string, provider?: string) => {
    if (editPerPlatform && provider) {
      // Update single platform
      setFinalPostText({
        ...finalPostText,
        [provider]: { text },
      });
    } else {
      // Update all platforms simultaneously
      const updatedText = providers.reduce(
        (acc, provider) => ({
          ...acc,
          [provider!]: { text },
        }),
        {}
      );
      setFinalPostText(updatedText);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-semibold pb-2">Details</h1>

      {!editPerPlatform ? (
        <Textarea
          placeholder="Write your post text here..."
          value={Object.values(finalPostText)[0]?.text || ""}
          onChange={(e) => handleTextChange(e.target.value)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {providers.map((provider) => {
            const Icon = socialIcons[provider as AccountType];
            if (!provider) {
              console.error("[DETAILS] missing provider");

              return null;
            }

            return (
              <div key={provider} className="flex flex-row gap-2 items-center">
                <Icon className="w-5 h-5" />
                <Textarea
                  className="textarea-xs"
                  placeholder={`Write your post text for ${provider} here...`}
                  value={finalPostText[provider].text || ""}
                  onChange={(e) => handleTextChange(e.target.value, provider)}
                />
              </div>
            );
          })}
        </div>
      )}

      <Separator className="my-3" />

      <div className="flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger
              asChild
              onClick={() => {
                if (disableEditPerPlatformButton) return;

                setEditPerPlatform(!editPerPlatform);
              }}
            >
              <ListCollapse
                className={cn(
                  `w-5 h-5 cursor-pointer hover:text-muted-foreground`,
                  disableEditPerPlatformButton && "text-muted-foreground"
                )}
              />
            </TooltipTrigger>
            <TooltipContent className="text-sm" side="right">
              <p>Edit per platform</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {postVideoFileURL && <ThumbnailPreview fileURL={postVideoFileURL} />}

        {/* published to */}
        <div className="flex flex-row gap-4 items-center">
          <p className="text-xs font-medium text-muted-foreground">
            Published to:
          </p>
          {selectedAccounts.map((account) => {
            const Icon = socialIcons[account.platform! as AccountType];

            return (
              <div key={account.id} className="relative">
                <SocialAvatar
                  className="w-7 h-7"
                  profile_picture_url={account.platform_profile_picture_url}
                  username={account.platform_username}
                />
                <div className="absolute -bottom-1 -right-2 text-muted-foreground bg-muted rounded-full p-[3px]">
                  <Icon className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
