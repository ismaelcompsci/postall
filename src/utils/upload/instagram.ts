// New file for Instagram-specific logic
export interface InstagramUploadParams {
  platfrom_user_id?: string | null;
  videoUrl: string;
  caption: string;
  coverUrl?: string;
  thumbOffset?: string;
  access_token?: string | null;
}

interface LongLivedAccessTokenResponse {
  access_token: string;
  token_type: string;
  error?: { message: string };
}

interface UserInfoResponse {
  data: {
    name: string;
    access_token: string;
    id: string;
    connected_instagram_account: {
      id: string;
      name: string;
      username: string;
      profile_picture_url: string;
    };
  }[];
}

export interface InstagramUploadResult {
  success: boolean;
  link: string;
  // publishesRemaining: number;
}

export class InstagramUploader {
  private static PRODUCT = "REELS";
  private static GRAPH_API_ORIGIN = "https://graph.facebook.com/v21.0/";

  private static buildGraphAPIURL(
    path: string,
    searchParams: Record<string, string>,
    accessToken: string
  ): string {
    const url = new URL(path, this.GRAPH_API_ORIGIN);
    Object.keys(searchParams).forEach(
      (key) => !searchParams[key] && delete searchParams[key]
    );
    url.search = new URLSearchParams(searchParams).toString();
    if (accessToken) url.searchParams.append("access_token", accessToken);

    return url.toString();
  }

  public static async getFacebookShortLivedToken({
    client_id,
    client_secret,
    redirect_uri,
    code,
  }: {
    client_id?: string;
    client_secret?: string;
    redirect_uri: string;
    code: string;
  }): Promise<string> {
    if (!client_id) throw new Error("Instagram client_id is missing");
    if (!client_secret) throw new Error("Instagram client_secret is missing");

    const params = {
      client_id,
      client_secret,
      code,
      redirect_uri,
    };

    const tokenUrl = this.buildGraphAPIURL("oauth/access_token", params, "");
    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (data.error_message) throw new Error(data.error_message);
    return data.access_token as string;
  }

  public static async getFacebookLongLivedToken({
    client_id,
    client_secret,
    short_lived_token,
  }: {
    client_id?: string;
    client_secret?: string;
    short_lived_token: string;
  }): Promise<LongLivedAccessTokenResponse> {
    if (!client_id) throw new Error("Instagram client_id is missing");
    if (!client_secret) throw new Error("Instagram client_secret is missing");

    const params = {
      client_id,
      client_secret,
      grant_type: "fb_exchange_token",
      fb_exchange_token: short_lived_token,
    };

    const tokenUrl = this.buildGraphAPIURL("oauth/access_token", params, "");
    const response = await fetch(tokenUrl);
    const data: LongLivedAccessTokenResponse = await response.json();

    if (!data.access_token || data.error) {
      throw new Error(
        "Something went wrong. Access token is missing! " +
          (data?.error?.message || "")
      );
    }

    return data;
  }

  public static async getFacebookUserInfo({
    access_token,
  }: {
    access_token: string;
  }): Promise<UserInfoResponse> {
    if (!access_token) throw new Error("No access_token provided");

    const params = {
      fields:
        "connected_instagram_account{id,name,username,profile_picture_url},name",
    };

    const userInfoUrl = this.buildGraphAPIURL(
      "me/accounts",
      params,
      access_token
    );
    const response = await fetch(userInfoUrl);
    return await response.json();
  }

  public static async refreshInstagramLongLivedToken({
    access_token,
  }: {
    access_token: string;
  }) {
    const params = {
      grant_type: "ig_refresh_token",
    };

    const refreshTokenUrl = this.buildGraphAPIURL(
      "refresh_access_token",
      params,
      access_token
    );

    const response = await fetch(refreshTokenUrl);
    const data = await response.json();

    const expires_in_to_milliseconds = data.expires_in * 1000;
    const expiresDateISO = new Date(
      Date.now() + expires_in_to_milliseconds
    ).toISOString();

    return {
      ...data,
      expires_in: expiresDateISO,
    };
  }

  public static async createMediaContainer(
    platfrom_user_id: string,
    params: Record<string, string>,
    access_token: string
  ): Promise<string> {
    try {
      const uploadVideoURL = this.buildGraphAPIURL(
        `${platfrom_user_id}/media`,
        params,
        access_token
      );

      const uploadResponse = await fetch(uploadVideoURL, { method: "POST" });
      if (!uploadResponse.ok) {
        throw new Error(
          `Failed to create media container: ${await uploadResponse.text()}`
        );
      }

      const upload = await uploadResponse.json();
      console.log("[InstagramUploader.createMediaContainer] upload ", upload);

      if (!upload.id) {
        throw new Error(
          "Failed to upload to instagram: Missing upload ID in response"
        );
      }

      return upload.id;
    } catch (error) {
      console.error("[InstagramUploader.createMediaContainer] Failed:", error);
      throw new Error(
        `Instagram media container creation failed: ${
          error instanceof Error && error.message
        }`
      );
    }
  }

  public static async checkMediaStatus(
    containerId: string,
    access_token: string
  ): Promise<boolean> {
    const checkStatusUri = this.buildGraphAPIURL(
      `${containerId}`,
      {
        fields: "status_code",
      },
      access_token
    );

    return await isUploadSuccessful(0, checkStatusUri);
  }

  public static async publishMedia(
    platfrom_user_id: string,
    containerId: string,
    access_token: string
  ): Promise<string> {
    const publishVideoUri = this.buildGraphAPIURL(
      `${platfrom_user_id}/media_publish`,
      {
        creation_id: containerId,
      },
      access_token
    );

    const publishResponse = await fetch(publishVideoUri, {
      method: "POST",
    });
    const publishData: { id: string } = await publishResponse.json();
    console.log(
      "[InstagramUploader.publishMedia] publish video response",
      publishData
    );

    return publishData.id;
  }

  public static async upload({
    access_token,
    videoUrl,
    caption,
    thumbOffset,
    coverUrl,
    platfrom_user_id,
  }: InstagramUploadParams): Promise<InstagramUploadResult> {
    try {
      if (!access_token) {
        throw new Error("No access_token found for Instagram upload");
      }

      if (!platfrom_user_id) {
        throw new Error("No platfrom_user_id found for Instagram upload");
      }

      const params: Record<string, string> = {
        media_type: this.PRODUCT,
        video_url: videoUrl,
        caption,
        share_to_feed: "true",
        location_id: "",
      };

      if (thumbOffset) {
        params.thumb_offset = thumbOffset;
      }

      if (coverUrl) {
        params.cover_url = coverUrl;
      }

      // Create container for media upload
      const containerId = await this.createMediaContainer(
        platfrom_user_id,
        params,
        access_token
      );

      // Check if media upload is complete
      const isUploaded = await this.checkMediaStatus(containerId, access_token);

      if (isUploaded) {
        // Publish the media
        const publishedMediaId = await this.publishMedia(
          platfrom_user_id,
          containerId,
          access_token
        );

        // Get permalink for the published media
        const permaLinkUri = this.buildGraphAPIURL(
          `${publishedMediaId}`,
          {
            fields: "permalink",
          },
          access_token
        );
        const permalinkResponse = await fetch(permaLinkUri);
        const permalinkData = await permalinkResponse.json();

        return {
          success: true,
          link: permalinkData.permalink,
        };
      } else {
        throw new Error("Instagram Reel upload failed");
      }
    } catch (e) {
      console.error("[InstagramUploader.upload] something went wrong ", e);
      throw e;
    }
  }
}
/**
 * Retrieves container status for the uploaded video, while its uploading in the backend asynchronously
 * and checks if the upload is complete.
 * @param {*} retryCount
 * @param {*} checkStatusUri
 * @returns Promise<boolean>
 */
async function isUploadSuccessful(
  retryCount: number,
  checkStatusUri: string
): Promise<boolean> {
  const MAX_RETRIES = 30;
  const RETRY_DELAY = 9000;

  try {
    if (retryCount >= MAX_RETRIES) {
      throw new Error(
        `Upload status check failed after ${MAX_RETRIES} attempts`
      );
    }

    const response = await fetch(checkStatusUri);
    if (!response.ok) {
      throw new Error(`Status check failed: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("[isUploadSuccessful] checking status:", data);

    if (!data.status_code) {
      throw new Error("Invalid status response from Instagram");
    }

    if (data.status_code === "ERROR") {
      throw new Error(`Upload failed with status: ${data.status_code}`);
    }

    if (data.status_code !== "FINISHED") {
      await _wait(RETRY_DELAY);
      return await isUploadSuccessful(retryCount + 1, checkStatusUri);
    }

    return true;
  } catch (error) {
    console.error("[isUploadSuccessful] error:", error);
    throw new Error(
      `Upload status check failed: ${error instanceof Error && error.message}`
    );
  }
}

/**
 * Setting retries with 3 seconds delay, as async video upload may take a while in the backed to return success
 * @param {*} n
 * @returns
 */
function _wait(n: number) {
  return new Promise((resolve) => setTimeout(resolve, n));
}
