"use client";

import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { useCreatePostStore } from "@/state/create-post-state";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type PreviewState = "processing" | "error" | "ready";

export const VideoPreview = () => {
  const { ffmpeg, loading } = useFFmpeg();
  const reset = useCreatePostStore((state) => state.reset);
  const file = useCreatePostStore((state) => state.file);
  const setPostFileURL = useCreatePostStore((state) => state.setPostFileURL);
  const setPostFile = useCreatePostStore((state) => state.setPostFile);
  const postFileURL = useCreatePostStore((state) => state.postFileURL);
  const setFileType = useCreatePostStore((state) => state.setFileType);
  const [previewState, setPreviewState] = useState<PreviewState>("processing");
  const errorRef = useRef<HTMLParagraphElement>(null);

  /// converts video to mp4
  const processVideoFile = async (
    file: File,
    cb: (p: number) => void
  ): Promise<File> => {
    if (!ffmpeg) {
      throw new Error("FFmpeg is not initialized.");
    }

    let videoElement = document.createElement("video");
    videoElement.preload = "metadata";

    let videoMetadata: { duration: number; width: number; height: number } =
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          resolve({
            duration: videoElement.duration,
            width: videoElement.videoWidth,
            height: videoElement.videoHeight,
          });
        };
        videoElement.onerror = reject;
        videoElement.src = URL.createObjectURL(file);
      });

    if (videoMetadata.duration < 3) {
      URL.revokeObjectURL(videoElement.src);
      throw new Error("Video must be at least 3 seconds long.");
    }
    if (videoMetadata.duration > 120) {
      URL.revokeObjectURL(videoElement.src);
      throw new Error("Video must be shorter than 2 minutes.");
    }

    if (Math.abs(videoMetadata.width / videoMetadata.height - 9 / 16) > 0.1) {
      URL.revokeObjectURL(videoElement.src);
      throw new Error(
        "Video must have a 9:16 aspect ratio (vertical format). Please crop your video accordingly."
      );
    }

    if (
      file.type === "video/mp4" &&
      videoMetadata.width <= 1080 &&
      videoMetadata.height <= 1920
    ) {
      console.log("Video is already in the correct format.");
      cb(100);
      return file;
    }

    let outputWidth, outputHeight;

    if (videoMetadata.width > 1080) {
      outputWidth = 1080;
      outputHeight = 1920;
    } else {
      outputWidth = videoMetadata.width;
      outputHeight = videoMetadata.height;
    }

    return await ffmpeg.convertToMp4(
      file,
      { width: outputWidth, height: outputHeight },
      cb
    );
  };

  /**
   * TIKTOK
   * Supported media formats
   *  - WebP
   *  - JPEG
   *
   * Picture size restrictions
   *  - Maximum 1080p
   *
   * Size restrictions
   *  - Maximum of 20MB for each image
   *
   */
  const proccessImageFile = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          const aspectRatio = img.width / img.height;

          // Set canvas dimensions based on aspect ratio
          if (Math.abs(aspectRatio - 1) <= 0.01) {
            canvas.width = canvas.height = Math.max(img.width, img.height);
          } else if (aspectRatio > 1) {
            canvas.width = img.width;
            canvas.height = img.width / 1.91;
          } else {
            canvas.width = 0.8 * img.height;
            canvas.height = img.height;
          }

          if (!context) {
            reject(new Error("Failed to get 2d context"));
            return;
          }

          context.fillStyle = "white";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0, img.width, img.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: "image/jpeg" }));
              } else {
                reject(new Error("Failed to create blob from canvas"));
              }
            },
            "image/jpeg",
            0.95
          );
        };

        img.onerror = () => reject(new Error("Failed to load image"));

        const targetFile = event.target?.result;

        if (!targetFile) {
          reject(new Error("Failed to load image"));
        }

        if (typeof targetFile === "string") {
          img.src = targetFile;
        } else {
          reject(new Error("Target was not found"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));

      reader.readAsArrayBuffer(file);
    });
  };

  const handleFile = async (file: File) => {
    if (!file) {
      setPreviewState("error");
      return;
    }

    if (file.size > 104857600) {
      toast.info(
        "Video file exceeds 100MB. This could take awhile to process..."
      );
    }

    let finalFile: File;
    if (file.type.startsWith("image/")) {
      setFileType("image");
      try {
        const proccessedFileImage = await proccessImageFile(file);

        finalFile = proccessedFileImage;
      } catch (e) {
        if (e instanceof Error) {
          console.error("Faild image processing", e);
          setPreviewState("error");
          toast.error("Failed to process Image file. Please try again.");

          if (errorRef.current) {
            errorRef.current.textContent = e.message;
          }
          return;
        }

        console.log("Error proccessing image ", e);
      }
    } else {
      setFileType("video");
      const progressCallback = (p: number) => {
        setPreviewState(p === 100 ? "ready" : "processing");
      };

      try {
        const proccessedVideoFile = await processVideoFile(
          file,
          progressCallback
        );
        toast.success("Video processed successfully.");

        finalFile = proccessedVideoFile;
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : "File is not supported";

        setPreviewState("error");
        toast.error("Error processing video. ", { description: errorMessage });
        if (e instanceof Error) {
          if (errorRef.current) {
            errorRef.current.textContent = e.message;
          }
        }

        reset();
        return;
      }
    }

    setPostFile(finalFile!);
    const proccessedFileURL = URL.createObjectURL(finalFile!);
    setPostFileURL(proccessedFileURL);
  };

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!file) {
      // TODO: BETTER ERROR HNALNE
      setPreviewState("error");
      return;
    }

    handleFile(file);
  }, [loading]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[9/16] min-h-[400px]">
        {previewState !== "ready" && (
          <div className="absolute z-10">
            <div className="flex flex-row items-center justify-center w-56 h-96 bg-black rounded-lg">
              {previewState === "processing" && (
                <p className="flex flex-row items-center justify-center gap-2 text-xs">
                  <Loader2 className="animate-spin w-4 h-4" />
                  Processing...
                </p>
              )}
              {previewState === "error" && (
                <p ref={errorRef} className="text-xs">
                  Error processing video.
                </p>
              )}
            </div>
          </div>
        )}
        <div className="w-full h-full relative">
          {previewState === "ready" && postFileURL ? (
            <video
              className="relative aspect-[9/16] max-h-[400px] rounded-lg bg-black"
              controls
              muted
              autoPlay
              loop
            >
              <source src={postFileURL} type={"video/mp4"} />
            </video>
          ) : (
            <div className="aspect-[9/16] min-h-[400px]"></div>
          )}
        </div>
      </div>
    </div>
  );
};
