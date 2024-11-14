"use client";

import { FileUp } from "lucide-react";
import { useRef } from "react";
import { useCreatePostStore } from "@/state/create-post-state";

export const FileUpload = () => {
  const setFile = useCreatePostStore((state) => state.setFile);
  const setStep = useCreatePostStore((state) => state.setStep);
  const hiddenFileInput = useRef<HTMLInputElement | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }
    const file = event.target.files[0];

    if (file) {
      setFile(file);
      setStep("choose-accounts");
    }
  };

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!event.dataTransfer.files) {
      return;
    }

    const file = event.dataTransfer.files[0];
    if (file) {
      setFile(file);
      setStep("choose-accounts");
    }
  };

  const handleClick = () => {
    if (!hiddenFileInput?.current) return;

    hiddenFileInput.current.click();
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="min-h-48 flex items-center justify-center hover:bg-accent/50 hover:cursor-pointer border-dashed border border-accent hover:border-accent-foreground transition-all rounded-lg p-4"
      >
        <div
          onDrop={handleDrag}
          onDragOver={(event) => event.preventDefault()}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <FileUp className="w-10 h-10" />

          <p className="text-muted-foreground text-sm">
            Click to upload a video file or drag and drop
          </p>
        </div>
      </div>
      <input
        type="file"
        // accept="image/jpeg,image/png,video/mp4,video/quicktime"
        accept="video/mp4,video/quicktime"
        onChange={handleChange}
        ref={hiddenFileInput}
        style={{ display: "none" }} // Make the file input element invisible
      />
    </>
  );
};
