"use client";

import { FileUpload } from "./file-upload";
import { Account, useCreatePostStore } from "@/state/create-post-state";
import { useEffect } from "react";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { Details } from "./details";
import { ChooseAccount } from "./choose-account";
import { VideoPreview } from "./video-preview";
import { Upload } from "./upload/upload";
import { PagingButtons } from "./paging-buttons";
import { CancelPostAlert } from "./cancel-post-alert";

interface CreatePostProps {
  accounts?: Account[] | null;
}

export const CreatePost = ({ accounts }: CreatePostProps) => {
  const step = useCreatePostStore((state) => state.step);

  const setAccounts = useCreatePostStore((state) => state.setAccounts);
  const {} = useFFmpeg();

  useEffect(() => {
    if (accounts) {
      setAccounts(accounts);
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center">
        <span className="text-lg font-gesit-mono text-muted-foreground">
          {step === "select-file" && "Select file"}
          {step === "choose-accounts" && "Choose accounts"}
          {step === "details" && "Details"}
          {step === "upload" && "Upload"}
        </span>

        {step !== "select-file" && <CancelPostAlert />}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg flex flex-col">
        {step === "select-file" && <FileUpload />}

        <div className="flex justify-between gap-4">
          {step === "choose-accounts" && <ChooseAccount />}
          {step === "details" && <Details />}
          {step === "upload" && <Upload />}

          {step !== "select-file" && <VideoPreview />}
        </div>

        <PagingButtons />
      </div>
    </div>
  );
};
