"use client";

import {
  Account,
  PostText,
  useCreatePostStore,
} from "@/state/create-post-state";
import { useMemo, useState } from "react";
import { socialIcons } from "../icons";
import { AccountType } from "@/lib/types";
import { SocialAvatar } from "../connected-accounts/social-avatar";
import { Button } from "../ui/button";
import { CloudUpload, Loader2 } from "lucide-react";
import { Separator } from "../ui/separator";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "../ui/alert-dialog";
import { AlertDialogDescription } from "@radix-ui/react-alert-dialog";
import { createClient } from "@/utils/supabase/client";
import { captionLimits } from "@/lib/platforms";
import { getMissingFields, uploadSchema } from "@/lib/schema";

export interface SamePlatformErrorState {
  show: boolean;
  message: string[];
}

export const Upload = () => {
  const supabase = createClient();
  const selectedAccounts = useCreatePostStore(
    (state) => state.selectedAccounts
  );
  const postText = useCreatePostStore((state) => state.postText);
  const editPerPlatform = useCreatePostStore((state) => state.editPerPlatform);
  const fileType = useCreatePostStore((state) => state.fileType);
  const postFile = useCreatePostStore((state) => state.postFile);
  const postThumbnailFile = useCreatePostStore(
    (state) => state.postThumbnailFile
  );

  const [samePlatFormState, setSamePlatformState] =
    useState<SamePlatformErrorState>({ show: false, message: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  /**
   * will always have a value because we set the text for all platforms when
   * doing single caption for all
   */
  const firstTextAvailiblePlatform =
    selectedAccounts[0].platform ?? "instagram";

  const getGroupedAccounts = (accounts: Account[]) => {
    return accounts.reduce((acc, account) => {
      acc[account.platform || ""] = acc[account.platform || ""] || [];
      acc[account.platform || ""].push(account);
      return acc;
    }, {} as Record<string, Account[]>);
  };

  const groupedAccounts = useMemo(() => {
    return getGroupedAccounts(selectedAccounts);
  }, [selectedAccounts]);

  const checkPlatformWithMultipleAccounts = () => {
    const results: Record<string, number> = {};
    Object.entries(groupedAccounts).map(([provider, accounts], index) => {
      if (accounts.length > 1) {
        results[provider] = accounts.length;
      }
    });

    return Object.entries(results).map(([platform, count]) => {
      return `${platform} (${count} accounts)`;
    });
  };

  const getUploadURL = async (prefix: string, file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from("media")
        .createSignedUploadUrl(`${prefix}/${file.name}`, { upsert: true });

      if (error) throw error;

      return { path: data.path, signedURL: data.signedUrl, token: data.token };
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const processUpload = async () => {
    if (isProcessing) {
      return;
    }

    const multipleSamePlatformAccounts = checkPlatformWithMultipleAccounts();
    if (multipleSamePlatformAccounts.length > 0) {
      setSamePlatformState({
        show: true,
        message: multipleSamePlatformAccounts,
      });

      return;
    }
    // get platfrom and account ids

    const platformsAndAccountIds = Object.entries(groupedAccounts).map(
      ([platform, accounts]) => ({
        name: platform,
        accountIds: accounts.map((account) => account.id),
      })
    );

    let totalAccounts = platformsAndAccountIds.reduce(
      (sum, platform) => sum + platform.accountIds.length,
      0
    );

    try {
      // resetting state
      setIsProcessing(true);
      setError(undefined);

      if (!postFile) {
        console.error("No file");
        setIsProcessing(false);
        setError("No File to upload");
        return;
      }

      // Uploading media file
      const { token, path } = await getUploadURL("mediaFiles", postFile);
      const { error: fileUploadError } = await supabase.storage
        .from("media")
        .uploadToSignedUrl(`mediaFiles/${postFile.name}`, token, postFile);

      if (fileUploadError) throw fileUploadError;

      // data to upload
      const formData = new FormData();

      // upload cover
      if (postThumbnailFile) {
        const { token, path } = await getUploadURL("covers", postThumbnailFile);
        const { error: fileUploadError } = await supabase.storage
          .from("media")
          .uploadToSignedUrl(
            `covers/${postThumbnailFile.name}`,
            token,
            postThumbnailFile
          );

        if (fileUploadError) throw fileUploadError;

        formData.append("coverKey", path);
        // TODO: needed
        // formData.append("coverTimestamp", "")
      }

      formData.append("fileKey", path);
      formData.append("mediaType", fileType);
      formData.append("platforms", JSON.stringify(platformsAndAccountIds));

      const captions: Record<string, string> = {};
      Object.entries(groupedAccounts).forEach(([platform, account]) => {
        const caption = postText[platform];
        const captionLimit = captionLimits[platform];

        captions[platform] = caption.text.slice(0, captionLimit);
      });

      formData.append("platformCaptions", JSON.stringify(captions));

      await submitPost(formData);
    } catch (e) {
      console.error("Upload failed ", e);
      if (e instanceof Error) {
        setError(e.message || "Failed to proccess your upload");
      } else {
        setError("Failed to proccess your upload");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const submitPost = async (formData: FormData) => {
    try {
      const u = uploadSchema.safeParse(Object.fromEntries(formData.entries()));

      if (!u.success) {
        console.log(getMissingFields(u.error));

        throw new Error("Upload data is missing");
      }

      const response = await fetch("/api/post-content", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      console.log(responseData);
      if (response.ok) {
      } else {
        console.error("Error posting content");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error Posting Content: ", error.message);

        setError("Falied to post content: " + error.message);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <SamePlatformErrorDialog
        open={samePlatFormState.show}
        onOpenChange={(open) =>
          setSamePlatformState((prev) => ({
            show: open,
            message: prev.message,
          }))
        }
        errorMessage={samePlatFormState.message}
      />

      <ProccessingDialog />

      {/* header */}
      <p className="text-muted-foreground font-gesit-mono text-md">
        Review & Upload
      </p>

      {editPerPlatform ? (
        <div className="space-y-4">
          <SectionContainer title="Publishing To:">
            <PerPlatformUploadDisplay
              groupedAccounts={groupedAccounts}
              postText={postText}
            />
          </SectionContainer>
        </div>
      ) : (
        <div className="space-y-4">
          <SectionContainer title="Caption">
            <div className="bg-muted/50 rounded-md p-2">
              <p className="px-2 text-sm text-muted-foreground">
                {postText[firstTextAvailiblePlatform].text}
              </p>
            </div>
          </SectionContainer>

          <SectionContainer title="Publishing To:">
            <PlatfromUploadDisplay groupedAccounts={groupedAccounts} />
          </SectionContainer>
        </div>
      )}

      <Button
        disabled={isProcessing}
        size={"lg"}
        className="float-right"
        onClick={processUpload}
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" />
            Posting...
          </>
        ) : (
          <>
            <CloudUpload />
            Post Now
          </>
        )}
      </Button>
    </div>
  );
};

const ProccessingDialog = () => {
  return <AlertDialog></AlertDialog>;
};

const PlatfromUploadDisplay = ({
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

const PerPlatformUploadDisplay = ({
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

const SectionContainer = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-background rounded-md px-3 py-4 space-y-1">
    <p className="text-xs font-gesit-mono">{title}</p>
    {children}
  </div>
);

const SamePlatformErrorDialog = ({
  open,
  onOpenChange,
  errorMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage: string[];
}) => {
  const setStep = useCreatePostStore((state) => state.setStep);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <h2 className="text-lg font-semibold font-gesit-mono">
            Multiple Accounts Warning
          </h2>
          <AlertDialogDescription className="space-y-2">
            <p className="text-xs">
              You have selected multiple accounts for the same platform(s):
              <ul className="list-disc pl-4 text-sm">
                {errorMessage.map((message) => (
                  <li key={message} className="font-semibold">
                    {message}
                  </li>
                ))}
              </ul>
            </p>
            <p className="text-xs">
              Posting the same video to the same platform multiple times will
              suppress your account's reach.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={() => setStep("choose-accounts")}>
            Change Accounts
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
