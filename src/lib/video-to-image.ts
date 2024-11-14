export const videoToImage = (
  videoFile: File | string,
  options: {
    frameTimeInSeconds?: number;
    filename?: string;
    extension?: string;
  } = {
    frameTimeInSeconds: 0.5,
    extension: "png",
  }
): Promise<File> => {
  return new Promise<File>((resolve) => {
    const canvas = document.createElement("canvas");
    const video = document.createElement("video");
    const source = document.createElement("source");
    const context = canvas.getContext("2d");

    var urlRef: string;
    if (typeof videoFile === "string") {
      urlRef = videoFile;
    } else {
      urlRef = URL.createObjectURL(videoFile);
    }

    video.style.display = "none";
    canvas.style.display = "none";

    source.setAttribute("src", urlRef);
    video.setAttribute("crossorigin", "anonymous");
    video.setAttribute("preload", "metadata");

    video.appendChild(source);
    document.body.appendChild(canvas);
    document.body.appendChild(video);

    if (!context) {
      return;
    }

    video.currentTime = options.frameTimeInSeconds ?? 0.1;
    video.load();

    video.addEventListener("loadedmetadata", function () {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    video.addEventListener("loadeddata", function () {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      canvas.toBlob((blob) => {
        if (!blob) return;

        resolve(
          new File(
            [blob],
            (options.filename || "prev") + "_preview." + options.extension,
            {
              type: "image/" + options.extension,
            }
          )
        );

        video.remove();
        canvas.remove();
      }, "image/" + options.extension);
    });
  });
};
