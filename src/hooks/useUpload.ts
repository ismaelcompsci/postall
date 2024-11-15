import { Account } from "@/state/create-post-state";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { getMissingFields } from "@/lib/schema";
import { captionLimits } from "@/lib/platforms";
import { uploadSchema } from "@/lib/schema";
import { PostContentResponse } from "@/utils/upload/helpers";

export const useUpload = () => {
  const supabase = createClient();

  const getUploadURL = async (prefix: string, file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from("media")
        .createSignedUploadUrl(`${prefix}/${file.name}`, { upsert: true });

      if (error) throw error;
      return { path: data.path, signedURL: data.signedUrl, token: data.token };
    } catch (error) {
      throw error;
    }
  };

  const mutation = useMutation({
    mutationFn: async ({
      postFile,
      postThumbnailFile,
      groupedAccounts,
      fileType,
      postText,
    }: {
      postFile: File | null;
      postThumbnailFile: File | null;
      groupedAccounts: Record<string, Account[]>;
      fileType: string;
      postText: Record<string, { text: string }>;
    }) => {
      if (!postFile) {
        throw new Error("No File to upload");
      }

      const platformsAndAccountIds = Object.entries(groupedAccounts).map(
        ([platform, accounts]) => ({
          name: platform,
          accountIds: accounts.map((account) => account.id),
        })
      );

      // Upload media file
      const { token, path } = await getUploadURL("mediaFiles", postFile);
      const { error: fileUploadError } = await supabase.storage
        .from("media")
        .uploadToSignedUrl(`mediaFiles/${postFile.name}`, token, postFile);

      if (fileUploadError) throw fileUploadError;

      const formData = new FormData();
      formData.append("fileKey", path);
      formData.append("mediaType", fileType);
      formData.append("platforms", JSON.stringify(platformsAndAccountIds));

      // Handle thumbnail if exists
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
      }

      // Handle captions
      const captions: Record<string, string> = {};
      Object.entries(groupedAccounts).forEach(([platform, account]) => {
        const caption = postText[platform];
        const captionLimit = captionLimits[platform];
        captions[platform] = caption.text.slice(0, captionLimit);
      });

      formData.append("platformCaptions", JSON.stringify(captions));

      const u = uploadSchema.safeParse(Object.fromEntries(formData.entries()));

      if (!u.success) {
        console.log(getMissingFields(u.error));

        throw new Error("Upload data is missing");
      }

      const response = await fetch("/api/post-content", {
        method: "POST",
        body: formData,
      });

      const json: PostContentResponse = await response.json();

      return json;
    },
  });

  return mutation;
};

export const useUploadMock = () => {
  const mutation = useMutation({
    mutationFn: async ({
      groupedAccounts,
    }: {
      groupedAccounts: Record<string, Account[]>;
    }): Promise<PostContentResponse> => {
      var response: PostContentResponse = {};

      const mockDelay = () =>
        new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 2000 + 1000)
        ); // Random delay between 1-3 seconds

      for (const [platfrom, _] of Object.entries(groupedAccounts)) {
        try {
          // Randomly throw error for testing (20% chance)
          if (Math.random() < 0.2) {
            throw new Error(`Random mock error for ${platfrom}`);
          }

          await mockDelay();

          response[platfrom] = {
            success: true,
            postURL: "mock-post-url",
          };
        } catch (e) {
          if (e instanceof Error) {
            response[platfrom] = {
              success: false,
              error: e.message ?? "error uploading to " + platfrom,
            };
          }
        }
      }

      return response;
    },
  });
  return mutation;
};
