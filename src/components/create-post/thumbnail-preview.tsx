import { videoToImage } from "@/lib/video-to-image";
import { useCreatePostStore } from "@/state/create-post-state";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { ChooseCoverDialog } from "./choose-cover";
import Image from "next/image";

export const ThumbnailPreview = ({ fileURL }: { fileURL: string }) => {
  const coverImage = useCreatePostStore((state) => state.postThumbnailURL);
  const setPostThumbnailFile = useCreatePostStore(
    (state) => state.setPostThumbnailFile
  );
  const setCoverImage = useCreatePostStore(
    (state) => state.setPostThumbnailURL
  );

  const handleCoverSelect = (cover: File) => {
    if (cover) {
      coverImage && URL.revokeObjectURL(coverImage);
      setPostThumbnailFile(cover);

      const coverURL = URL.createObjectURL(cover);
      setCoverImage(coverURL);
    }
  };

  const setFirstFrameAsCover = useCallback(async (fileURL: string) => {
    const imageFile = await videoToImage(fileURL, {
      filename: "first_frame",
      frameTimeInSeconds: 0.5,
      extension: "jpeg",
    });
    const imageURL = URL.createObjectURL(imageFile);
    setPostThumbnailFile(imageFile);
    setCoverImage(imageURL);
  }, []);

  useEffect(() => {
    if (!coverImage) {
      setFirstFrameAsCover(fileURL);
    }
  }, [fileURL]);

  return (
    <ChooseCoverDialog fileURL={fileURL} onCoverSelect={handleCoverSelect}>
      <div className="cursor-pointer">
        {coverImage ? (
          <div className="relative aspect-[9/16] max-w-[124px] overflow-hidden">
            <Image
              src={coverImage}
              width={124}
              height={124}
              alt="Selected cover"
              className="rounded-md"
            />
            <p className="max-w-[124px] rounded-b-md bg-gray-500/30 py-2 text-center bottom-0 text-xs absolute w-full">
              Edit cover
            </p>
          </div>
        ) : (
          <div className="aspect-[9/16] max-w-[124px] flex bg-background items-center justify-center gap-2">
            <Loader2 className="animate-spin h-2 w-2" />
            <p className="text-xs text-secondary-foreground">Loading...</p>
          </div>
        )}
      </div>
    </ChooseCoverDialog>
  );
};
