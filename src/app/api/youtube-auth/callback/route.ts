import { getURL } from "@/lib/utils";
import { APP_SERVER_CONSTANTS } from "@/utils/constants";
import { insertSocialLogin } from "@/utils/socialLoginActions";

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const getYoutubeToken = async (body: {
  client_id?: string;
  client_secret?: string;
  redirect_uri: string;
  code: string;
  grant_type: string;
}) => {
  if (!body.client_id) {
    throw new Error("Youtube client_id is missing");
  }

  if (!body.client_secret) {
    throw new Error("Youtube client_secret is missing");
  }

  let url = APP_SERVER_CONSTANTS.youtube.tokenUrl;

  const httpBody = Object.keys(body)
    .map(
      (key) =>
        // @ts-ignore
        `${encodeURIComponent(key)}=${encodeURIComponent(body[key] ?? "")}`
    )
    .join("&");

  const response = await fetch(url, {
    method: "POST",
    body: httpBody,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = await response.json();
  const { access_token, refresh_token, expires_in } = data;

  if (!access_token) {
    throw new Error("Error getting access_token from google");
  }

  return { access_token, refresh_token, expires_in };
};

const getYoutubeChannels = async ({
  access_token,
}: {
  access_token: string;
}) => {
  if (!access_token) {
    throw new Error("No Access Token");
  }

  let url =
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,id&mine=true";

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const data: UserChannelListResponse = await response.json();

  return data;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const code = request.nextUrl.searchParams.get("code");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      console.log("User not found", userError);
      throw userError;
    }

    if (!code) {
      return NextResponse.redirect(
        getURL(
          `/dashboard/connected-accounts?success=false&message=No code provided`
        )
      );
    }

    /**
     * expires_in -
     * The remaining lifetime of the access token in seconds. 1 hour usally
     *
     * refresh_token -
     * A token that you can use to obtain a new access token.
     * Refresh tokens are valid until the user revokes access.
     * Again, this field is only present in this response
     * if you set the access_type parameter to offline in the initial
     * request to Google's authorization server.
     *
     * As long as the user has not revoked the access granted to the application,
     * the token server returns a JSON object that contains a new access token.
     */
    const { access_token, refresh_token, expires_in } = await getYoutubeToken({
      client_id: APP_SERVER_CONSTANTS.youtube.clientId,
      client_secret: APP_SERVER_CONSTANTS.youtube.clientSecret,
      redirect_uri: APP_SERVER_CONSTANTS.redirectUri(
        "/api/youtube-auth/callback"
      ),
      code: code,
      grant_type: "authorization_code",
    });

    const channels = await getYoutubeChannels({ access_token });

    if (!channels.items || channels.items?.length === 0) {
      throw new Error("Something went wrong trying to get Youtube channles");
    }

    const channel = channels.items[0];

    const username = channel.snippet?.title;
    const platform_profile_picture_url =
      channel.snippet?.thumbnails?.default?.url;
    const channelId = channel.id;

    if (!username || !platform_profile_picture_url || !channelId) {
      throw new Error("Missing requried data from Google");
    }

    const error = await insertSocialLogin(supabase, {
      user_id: user.id,
      platform: "youtube",
      platform_username: username,
      platform_profile_picture_url: platform_profile_picture_url,
      platform_user_id: channelId,
      access_token: access_token,
      refresh_token: refresh_token,
      token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    });

    if (error) {
      throw error;
    }

    return NextResponse.redirect(
      getURL("/dashboard/connected-accounts?success=true")
    );
  } catch (error) {
    console.error("Error in youtube auth callback", error);
    return NextResponse.redirect(
      getURL("/dashboard/connected-accounts?success=false")
    );
  }
}

export interface UserChannelListResponse {
  items?: Channel[];
}

export interface Channel {
  id?: string;
  snippet?: {
    title?: string | null;
    customUrl?: string | null;
    thumbnails?: {
      default?: YoutubeThumbnail;
      medium?: YoutubeThumbnail;
      high?: YoutubeThumbnail;
    };
  };
}

export interface YoutubeThumbnail {
  /**
   * (Optional) Height of the thumbnail image.
   */
  height?: number | null;
  /**
   * The thumbnail image's URL.
   */
  url?: string | null;
  /**
   * (Optional) Width of the thumbnail image.
   */
  width?: number | null;
}
