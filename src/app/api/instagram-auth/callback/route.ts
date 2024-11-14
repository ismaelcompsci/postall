import { getURL } from "@/lib/utils";
import { APP_SERVER_CONSTANTS } from "@/utils/constants";
import { createClient } from "@/utils/supabase/server";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const shortLivedAccessToken = await getFacebookShortLivedToken({
      client_id: APP_SERVER_CONSTANTS.instagram.clientId,
      client_secret: APP_SERVER_CONSTANTS.instagram.clientSecret,
      code: code,
      redirect_uri: APP_SERVER_CONSTANTS.redirectUri(
        "/api/instagram-auth/callback"
      ),
    });

    /**
     * Long-lived tokens are valid for 60 days and can be refreshed as long as they are at least 24 hours old but have not expired
     */
    const longLivedAccessToken = await getFacebookLongLivedToken({
      client_id: APP_SERVER_CONSTANTS.instagram.clientId,
      client_secret: APP_SERVER_CONSTANTS.instagram.clientSecret,
      short_lived_token: shortLivedAccessToken,
    });

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user?.id) {
      console.log("No session found", userError);
      return NextResponse.redirect(getURL("/login"));
    }

    const userAccountData = await getFacebookUserInfo({
      access_token: longLivedAccessToken.access_token,
    });

    const accounts = userAccountData.data.map((account) => {
      return {
        instagram_id: account.connected_instagram_account.id,
        instagram_name: account.connected_instagram_account.name,
        instagram_username: account.connected_instagram_account.username,
        instagram_profile_picture_url:
          account.connected_instagram_account.profile_picture_url,
        instagram_access_token: longLivedAccessToken.access_token,
        page_name: account.name,
        page_id: account.id,
      };
    });

    const instagramAccountsEncoded = encodeURIComponent(
      JSON.stringify(accounts)
    );

    let returnURL = getURL("/dashboard/connected-accounts");

    returnURL += `?instagram_accounts=${instagramAccountsEncoded}`;
    returnURL += `&instagram_token=${longLivedAccessToken}`;

    return NextResponse.redirect(returnURL);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      getURL(`/dashboard/connected-accounts?success=false&message=${error}`)
    );
  }
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

export const getFacebookShortLivedToken = async ({
  client_id,
  client_secret,
  redirect_uri,
  code,
}: {
  client_id?: string;
  client_secret?: string;
  redirect_uri: string;
  code: string;
}): Promise<string> => {
  if (!client_id) {
    throw new Error("Instagram client_id is missing");
  }

  if (!client_secret) {
    throw new Error("Instagram client_secret is missing");
  }

  let facebookTokenUrl = APP_SERVER_CONSTANTS.instagram.tokenUrl;

  facebookTokenUrl += `?client_id=${client_id}`;
  facebookTokenUrl += `&client_secret=${client_secret}`;
  facebookTokenUrl += `&code=${code}`;
  facebookTokenUrl += `&redirect_uri=${redirect_uri}`;

  const response = await fetch(facebookTokenUrl);
  const data = await response.json();

  const { access_token, error_message } = data;

  if (error_message) {
    throw new Error(error_message);
  }

  return access_token;
};

export const getFacebookLongLivedToken = async ({
  client_id,
  client_secret,
  short_lived_token,
}: {
  client_id?: string;
  client_secret?: string;
  short_lived_token: string;
}) => {
  if (!client_id) {
    throw new Error("Instagram client_id is missing");
  }

  if (!client_secret) {
    throw new Error("Instagram client_secret is missing");
  }

  let facebookTokenUrl = APP_SERVER_CONSTANTS.instagram.tokenUrl;

  const payload = {
    client_id: `${client_id}`,
    client_secret: `${client_secret}`,
    grant_type: "fb_exchange_token",
    fb_exchange_token: `${short_lived_token}`,
  };

  facebookTokenUrl += `?client_id=${payload.client_id}`;
  facebookTokenUrl += `&client_secret=${payload.client_secret}`;
  facebookTokenUrl += `&grant_type=${payload.grant_type}`;
  facebookTokenUrl += `&fb_exchange_token=${payload.fb_exchange_token}`;

  const response = await fetch(facebookTokenUrl, {
    method: "GET",
  });

  const data: {
    access_token: string;
    token_type: string;
    error?: { message: string };
  } = await response.json();

  if (!data.access_token || data.error) {
    throw new Error(
      "Something went wrong. Access token is missing! " + data?.error?.message
        ? data?.error?.message
        : ""
    );
  }

  return data;
};

export const getFacebookUserInfo = async ({
  access_token,
}: {
  access_token: string;
}) => {
  if (!access_token) {
    throw new Error("No access_token provided");
  }

  let userInfoUrl = "https://graph.facebook.com/v21.0/me/accounts";

  userInfoUrl += `?access_token=${access_token}`;
  userInfoUrl += `&fields=connected_instagram_account{id,name,username,profile_picture_url},name`;

  const userInfoResponse = await fetch(userInfoUrl);
  const responseData: UserInfoResponse = await userInfoResponse.json();

  return responseData;
};
