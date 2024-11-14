import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import React, { useState, useRef, useEffect } from "react";
import { Slider } from "../ui/slider";

export const ChooseCoverDialog = ({
  children,
  onCoverSelect,
  fileURL,
}: {
  children: React.ReactNode;
  onCoverSelect: (file: File) => void;
  fileURL: string;
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choose Cover</AlertDialogTitle>
        </AlertDialogHeader>

        {fileURL ? (
          <VideoCoverSelector
            videoSrc={fileURL}
            onCoverChange={onCoverSelect}
          />
        ) : (
          <AlertDialogDescription>
            video is still processing...
          </AlertDialogDescription>
        )}
        <AlertDialogFooter>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function VideoCoverSelector({
  videoSrc,
  onCoverChange,
}: {
  videoSrc: string;
  onCoverChange: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => setDuration(video.duration);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => video.removeEventListener("loadedmetadata", updateDuration);
  }, []);

  const captureFrame = (): string | undefined => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "cover.jpeg", { type: "image/jpeg" });

      onCoverChange(file);
    });
  };

  const handleSliderChange = (value: number[]) => {
    const time = value[0];
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="aspect-[9/16] border max-h-[400px] rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
        />
      </div>
      <Slider
        min={0}
        max={duration}
        step={0.1}
        value={[currentTime]}
        onValueChange={handleSliderChange}
        onValueCommit={(v) => {
          captureFrame();
        }}
        className="w-full"
      />
      <div className="text-center text-sm text-gray-600">
        {currentTime.toFixed(1)} / {duration.toFixed(1)} seconds
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
