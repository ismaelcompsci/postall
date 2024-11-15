import { FFmpeg as FFmpegBase } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export class FFmpeg {
  private static instance: FFmpeg;
  private static ffmpeg: FFmpegBase = new FFmpegBase();
  ffmpeg: FFmpegBase;

  private constructor(ffmpeg: FFmpegBase) {
    this.ffmpeg = ffmpeg;

    // this.ffmpeg.on("log", (log) => {
    //   console.log("LOG", log);
    // });
  }

  public static async getInstance() {
    if (!FFmpeg.instance) {
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

      const [workerURL, coreURL, wasmURL] = await Promise.all([
        toBlobURL(`/ffmpeg//814.ffmpeg.js`, "text/javascript"),
        toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      ]);

      await FFmpeg.ffmpeg.load({
        classWorkerURL: workerURL,
        coreURL,
        wasmURL,
      });

      FFmpeg.instance = new FFmpeg(FFmpeg.ffmpeg);
    }

    return FFmpeg.instance;
  }

  /**
   * writes file to wasm ffmpeg
   */
  private async writeInputFile(file: File, fileName: string) {
    const fileUrl = URL.createObjectURL(file);
    const fileData = await fetchFile(fileUrl);
    await this.ffmpeg.writeFile(fileName, fileData);

    return fileName;
  }

  public async convertToMp4(
    file: File,
    { width, height }: { width: number; height: number },
    cb: (progress: number) => void
  ) {
    this.ffmpeg.on("progress", (event) => {
      let { progress } = event;
      cb(Math.round(progress * 100));
    });
    const fileName = await this.writeInputFile(file, "input.mp4");
    await this.ffmpeg.exec([
      "-i",
      fileName,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-vf",
      `scale=${width}:${height}`,
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-ar",
      "48000",
      "-ac",
      "2",
      "-y",
      "output.mp4",
    ]);

    const outputFileBuffer = await this.ffmpeg.readFile("output.mp4");
    if (!outputFileBuffer) {
      throw new Error("Failed to read output file");
    }

    const blob = new Blob([outputFileBuffer], { type: "video/mp4" });

    const processedFile = new File(
      [blob],
      // remove extension
      file.name.replace(/\.[^/.]+$/, "") + "_processed.mp4",
      {
        type: "video/mp4",
      }
    );

    cb(100);
    return processedFile;
  }
}
