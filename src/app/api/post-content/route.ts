import { uploadSchema } from "@/lib/schema";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { PlatformToUpload } from "@/lib/types";
import { InstagramUploader } from "@/utils/upload/instagram";
import PostgrestError, {
  MediaUrls,
  PlatformAccountData,
  PostContentResponse,
  SupabaseClientType,
  UploadPlatformResponse,
} from "@/utils/upload/helpers";
import { User } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateUser();
    const parsedData = await validateFormData(request);
    const uploadResults = await handlePlatformUploads(
      parsedData,
      user,
      supabase
    );

    return NextResponse.json(uploadResults);
  } catch (error) {
    return handleError(error);
  }
}

// Add custom error classes
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

class PlatformUploadError extends Error {
  constructor(platform: string, message: string) {
    super(`${platform}: ${message}`);
    this.name = "PlatformUploadError";
  }
}

class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaError";
  }
}

async function authenticateUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthenticationError(userError?.message || "Not authenticated");
  }

  return { user, supabase };
}

async function validateFormData(request: NextRequest) {
  const formData = await request.formData();
  const { data, success, error } = uploadSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!success) throw error;
  return data;
}

function handleError(error: unknown): NextResponse {
  console.error("ERROR POSTING CONTENT", error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: "Invalid input data", details: error.errors } },
      { status: 400 }
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: { message: "Authentication failed", details: error.message } },
      { status: 401 }
    );
  }

  if (error instanceof PlatformUploadError) {
    return NextResponse.json(
      { error: { message: "Platform upload failed", details: error.message } },
      { status: 502 }
    );
  }

  if (error instanceof MediaError) {
    return NextResponse.json(
      { error: { message: "Media processing failed", details: error.message } },
      { status: 400 }
    );
  }

  if (error instanceof PostgrestError) {
    return NextResponse.json(
      { error: { message: "Database error", details: error.message } },
      { status: 500 }
    );
  }

  // Generic error handler as fallback
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";
  return NextResponse.json(
    { error: { message: "Internal Server Error", details: errorMessage } },
    { status: 500 }
  );
}

export async function getPlatformAccountData(
  platform: PlatformToUpload,
  user: User,
  supabase: SupabaseClientType
): Promise<PlatformAccountData> {
  try {
    const accountId = platform.accountIds[0];
    console.log("[getPlatformAccountData] accountId: " + accountId);

    const { data, error } = await supabase
      .from("social_connections")
      .select(
        "id,access_token,platform_user_id,token_expires_at,refresh_token,refresh_token_expires_at"
      )
      .eq("user_id", user.id)
      .eq("platform", platform.name)
      .eq("id", accountId)
      .limit(1)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`No account found for platform ${platform.name}`);
    }

    // Check if tokens need refresh
    if (
      data.refresh_token &&
      data.token_expires_at &&
      shouldRefreshToken(data.token_expires_at)
    ) {
      const { access_token, expires_in, token_type } = await refreshTokens(
        data,
        platform.name
      );

      const { error: updateTokenError } = await supabase
        .from("social_connections")
        .update({ access_token: access_token, token_expires_at: expires_in })
        .eq("id", accountId)
        .eq("platform", platform.name)
        .eq("user_id", user.id);

      if (updateTokenError) {
        throw updateTokenError;
      }

      data.access_token = access_token;
      data.token_expires_at = expires_in;
    }

    return data;
  } catch (e) {
    console.error("[getPlatformAccountData] something went wrong: ", e);
    throw e;
  }
}

export const refreshTokens = async (
  data: {
    id: string;
    access_token: string | null;
    platform_user_id: string | null;
    token_expires_at: string | null;
    refresh_token: string | null;
    refresh_token_expires_at: string | null;
  },
  platform: string
) => {
  switch (platform) {
    case "instagram":
      const access_token = data.access_token;
      if (!access_token) {
        throw new Error("No access_token found for refresh");
      }

      const tokens = await InstagramUploader.refreshInstagramLongLivedToken({
        access_token,
      });
      return tokens;

    case "youtube":
      console.log("REFRESH YOUTUBE");

    default:
      throw new Error(`Refreshing token error - ${platform}`);
  }
};

// Helper function to check if token needs refresh
function shouldRefreshToken(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expiryTime = new Date(expiresAt).getTime();
  const currentTime = Date.now(); // You can use Date.now() to get current time in milliseconds
  // Refresh if token expires in less than 24 hours
  return expiryTime - currentTime < 24 * 60 * 60 * 1000;
}

export async function handlePlatformUploads(
  parsedData: any,
  user: User,
  supabase: SupabaseClientType
): Promise<PostContentResponse> {
  const { fileKey, coverKey, platforms, platformCaptions } = parsedData;
  const parsedPlatforms: PlatformToUpload[] = JSON.parse(platforms);
  const parsedPlatformCaptions: Record<string, string> =
    JSON.parse(platformCaptions);

  const response: PostContentResponse = {};

  for (const platform of parsedPlatforms) {
    try {
      const accountData = await getPlatformAccountData(
        platform,
        user,
        supabase
      );

      const mediaUrls = await getSignedMediaUrls(supabase, fileKey, coverKey);

      response[platform.name] = await uploadToPlatform(
        platform,
        accountData,
        mediaUrls,
        parsedPlatformCaptions[platform.name]
      );
    } catch (error) {
      console.error("Uploading to platfrom failed: " + platform.name, error);
      response[platform.name] = createErrorResponse(error);
    }
  }

  return response;
}

// Handles the upload to specific platforms
async function uploadToPlatform(
  platform: PlatformToUpload,
  accountData: PlatformAccountData,
  mediaUrls: MediaUrls,
  caption: string
): Promise<UploadPlatformResponse> {
  try {
    switch (platform.name.toLowerCase()) {
      case "instagram":
        console.log("[uploadToPlatform] uploading to instagram...");

        return await InstagramUploader.upload({
          access_token: accountData.access_token,
          platfrom_user_id: accountData.platform_user_id,
          videoUrl: mediaUrls.fileUrl,
          coverUrl: mediaUrls.coverUrl,
          caption,
        });

      // Add more platforms here
      default:
        throw new Error(`Unsupported platform: ${platform.name}`);
    }
  } catch (e) {
    console.error("[uploadToPlatform] something went wrong: ", e);
    throw new PlatformUploadError(
      platform.name,
      e instanceof Error ? e.message : "Unknown platform error"
    );
  }
}

// Gets signed URLs for media files from Supabase storage
async function getSignedMediaUrls(
  supabase: SupabaseClientType,
  fileKey: string,
  coverKey?: string
): Promise<MediaUrls> {
  console.log("[getSignedMediaUrls] getting signed url for media");
  // filter out undefiend
  const mediaPaths = [fileKey, coverKey].filter((item) => item !== undefined);
  const { data: signedUrls, error: signedUrlsError } = await supabase.storage
    .from("media")
    // 10 minute valid url
    .createSignedUrls(mediaPaths, 60 * 10);

  if (signedUrlsError) {
    throw signedUrlsError;
  }

  const { signedUrl: mediaSignedURL } =
    signedUrls.find((res) => res.path === fileKey) || {};
  const { signedUrl: coverSignedURL } =
    signedUrls.find((res) => res.path === coverKey) || {};

  if (!mediaSignedURL) {
    throw new MediaError("Media file url could not be found");
  }

  if (!coverSignedURL && coverKey) {
    throw new MediaError("Cover file url could not be found");
  }

  return {
    fileUrl: mediaSignedURL,
    coverUrl: coverSignedURL,
  };
}

// Creates a standardized error response
function createErrorResponse(error: unknown): UploadPlatformResponse {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";
  return {
    success: false,
    error: errorMessage,
  };
}

// // unfinished
// const youtubeUpload = async ({ access_token }: { access_token: string }) => {
//   const part = ["snippet,status"];
//   const snippet = {};

//   const OAuth2 = google.auth.OAuth2;
//   const oauth2Client = new OAuth2();
//   oauth2Client.setCredentials({ access_token: access_token });

//   const youtube = google.youtube({
//     version: "v3",
//     auth: oauth2Client,
//   });

//   const response = await youtube.videos.insert({
//     requestBody: {
//       snippet: {},
//     },
//     media: {},
//   });
// };
