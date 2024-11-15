"use client";

import { Account, useCreatePostStore } from "@/state/create-post-state";
import { useMemo, useState } from "react";
import { Button } from "../../ui/button";
import { CloudUpload, Loader2 } from "lucide-react";
import {
  PerPlatformUploadDisplayPreview,
  PlatfromUploadDisplayPreview,
} from "../caption-display";
import { SectionContainer } from "../caption-display";
import { useUpload, useUploadMock } from "@/hooks/useUpload";
import { UploadSuccess } from "./upload-success";
import { UploadError } from "./upload-error";
import { UploadProgress } from "./upload-progress";
import { boolean } from "zod";
import { SamePlatfromErrorDialog } from "../same-platform-error-dialog";

export const Upload = () => {
  const selectedAccounts = useCreatePostStore(
    (state) => state.selectedAccounts
  );
  const postText = useCreatePostStore((state) => state.postText);
  const editPerPlatform = useCreatePostStore((state) => state.editPerPlatform);
  const fileType = useCreatePostStore((state) => state.fileType);
  const originalFile = useCreatePostStore((state) => state.file);
  const postThumbnailFile = useCreatePostStore(
    (state) => state.postThumbnailFile
  );

  const [multipleSamePlatformAccounts, setMultipleSamePlatformAccounts] =
    useState<{ open: boolean; message: string[] }>({
      open: false,
      message: [],
    });

  const {
    mutate: upload,
    isPending: isProcessing,
    error,
    data,
    status,
    isError,
  } = useUpload();

  // const {
  //   mutate: upload,
  //   isPending: isProcessing,
  //   error,
  //   data,
  //   status,
  //   isError,
  // } = useUploadMock();

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

  const checkPlatformWithMultipleAccounts = (
    groupedAccounts: Record<string, Account[]>
  ) => {
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

  const processUpload = async () => {
    if (isProcessing) return;

    const multipleSamePlatformAccounts =
      checkPlatformWithMultipleAccounts(groupedAccounts);

    if (multipleSamePlatformAccounts.length > 0) {
      setMultipleSamePlatformAccounts({
        open: true,
        message: multipleSamePlatformAccounts,
      });

      return;
    }

    upload({
      // @ts-ignore
      postFile: originalFile,
      postThumbnailFile,
      groupedAccounts,
      fileType,
      postText,
    });
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in">
      <p className="text-muted-foreground font-gesit-mono text-md">
        Review & Upload
      </p>
      <SamePlatfromErrorDialog
        open={multipleSamePlatformAccounts.open}
        errorMessage={multipleSamePlatformAccounts.message}
        setOpen={(open) => {
          setMultipleSamePlatformAccounts({ open: open, message: [] });
        }}
      />
      {status === "error" && <UploadError error={error} />}
      {status === "pending" && (
        <UploadProgress groupedAccounts={groupedAccounts} />
      )}
      {status === "success" && data && (
        <UploadSuccess data={data} groupedAccounts={groupedAccounts} />
      )}
      {status === "idle" && (
        <div className="animate-in fade-in zoom-in flex flex-col gap-4">
          {editPerPlatform ? (
            <div className="space-y-4">
              <SectionContainer title="Publishing To:">
                <PerPlatformUploadDisplayPreview
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
                <PlatfromUploadDisplayPreview
                  groupedAccounts={groupedAccounts}
                />
              </SectionContainer>
            </div>
          )}

          <Button
            disabled={isProcessing || isError}
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
      )}
    </div>
  );
};
