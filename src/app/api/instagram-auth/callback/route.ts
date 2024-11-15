import { getURL } from "@/lib/utils";
import { APP_SERVER_CONSTANTS } from "@/utils/constants";
import { createClient } from "@/utils/supabase/server";
import { InstagramUploader } from "@/utils/upload/instagram";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const shortLivedAccessToken =
      await InstagramUploader.getFacebookShortLivedToken({
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
    const longLivedAccessToken =
      await InstagramUploader.getFacebookLongLivedToken({
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

    const userAccountData = await InstagramUploader.getFacebookUserInfo({
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
