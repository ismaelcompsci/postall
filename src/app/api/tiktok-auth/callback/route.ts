import { getURL } from "@/lib/utils";
import { APP_SERVER_CONSTANTS } from "@/utils/constants";
import { insertSocialLogin } from "@/utils/socialLoginActions";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieJar = await cookies();
    const code_verifier = cookieJar.get("code_verifier")?.value;
    const tiktokAuthError = request.nextUrl.searchParams.get("error");
    const { code, redirect_uri } = await request.json();

    const tiktokAuthErrorDescription =
      request.nextUrl.searchParams.get("error_description");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user?.id) {
      throw userError;
    }

    if (tiktokAuthError) {
      return NextResponse.redirect(
        getURL(
          `/dashboard/connected-accounts?success=false&message=${tiktokAuthErrorDescription}`
        )
      );
    }

    if (!code_verifier) {
      throw new Error("Missing code verifier");
    }

    const {
      access_token,
      expires_in,
      refresh_token,
      refresh_expires_in,
      scope,
      token_type,
      tokenError,
      tokenErrorDescription,
    } = await getTiktokToken({
      code: code,
      client_id: APP_SERVER_CONSTANTS.tiktok.clientId!,
      grant_type: "authorization_code",
      code_verifier: code_verifier,
      redirect_uri: redirect_uri,
      client_secret: APP_SERVER_CONSTANTS.tiktok.clientSecret!,
    });

    if (tokenError && tokenErrorDescription) {
      throw new Error(
        "Error getting TikTok access token." + tokenErrorDescription
      );
    }

    const userInfo = await getTiktokUserInfo({ access_token });

    const { avatar_url_100, display_name, open_id } = userInfo;

    /**
     * The expiration of access_token in seconds. It is valid for 24 hours after initial issuance.
     */
    const token_expires_at = new Date(Date.now() + parseInt(expires_in) * 1000);

    /**
     * The token to refresh access_token. It is valid for 365 days after the initial issuance.
     */
    const refresh_token_expires_at = new Date(
      Date.now() + parseInt(refresh_expires_in) * 1000
    );

    const error = await insertSocialLogin(supabase, {
      user_id: user.id,
      platform: "tiktok",
      platform_username: display_name,
      platform_profile_picture_url: avatar_url_100,
      platform_user_id: open_id,
      access_token: access_token,
      token_expires_at: token_expires_at.toISOString(),
      refresh_token: refresh_token,
    });

    if (error) {
      throw error;
    }

    return NextResponse.redirect(
      getURL("/dashboard/connected-accounts?success=true")
    );
  } catch (error) {
    console.error("Error in tiktok auth callback", error);
    return NextResponse.redirect(
      getURL("/dashboard/connected-accounts?success=false")
    );
  }
}

const getTiktokUserInfo = async ({
  access_token,
}: {
  access_token: string;
}) => {
  const userInfoEndpoint = "https://open.tiktokapis.com/v2/user/info/";
  const userInfoResponse = await fetch(userInfoEndpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const userInfoData = await userInfoResponse.json();

  return userInfoData;
};

const getTiktokToken = async ({
  client_id,
  client_secret,
  redirect_uri,
  code_verifier,
  grant_type,
  code,
}: {
  client_id: string;
  client_secret: string;
  code_verifier: string;
  redirect_uri: string;
  grant_type: string;
  code: string;
}) => {
  if (!client_id) {
    throw new Error("Tiktok client_id is missing");
  }

  if (!client_secret) {
    throw new Error("Tiktok client_secret is missing");
  }

  const urlParams = new URLSearchParams({
    client_key: client_id,
    client_secret,
    code_verifier,
    redirect_uri,
    grant_type,
    code,
  });

  const tokenResponse = await fetch(APP_SERVER_CONSTANTS.tiktok.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: urlParams,
  });

  const {
    access_token,
    expires_in,
    refresh_token,
    scope,
    token_type,
    refresh_expires_in,
    error: tokenError,
    error_description: tokenErrorDescription,
  } = await tokenResponse.json();

  return {
    access_token,
    expires_in,
    refresh_token,
    refresh_expires_in,
    scope,
    token_type,
    tokenError,
    tokenErrorDescription,
  };
};
