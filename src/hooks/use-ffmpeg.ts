import { FFmpeg } from "@/lib/ffmpeg";
import { useEffect, useState } from "react";

interface UseFFmpegState {
  ffmpeg: FFmpeg | null;
  loading: boolean;
}

export const useFFmpeg = () => {
  const [state, setState] = useState<UseFFmpegState>({
    ffmpeg: null,
    loading: true,
  });

  useEffect(() => {
    const load = async () => {
      const ffmpeg = await FFmpeg.getInstance();
      setState({ ffmpeg, loading: false });
    };

    load();
  }, []);

  return state;
};
