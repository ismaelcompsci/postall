import { APP_SERVER_CONSTANTS } from "@/utils/constants";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (!APP_SERVER_CONSTANTS.instagram.clientId) {
    throw new Error("INSTAGRAM_CLIENT_ID is not set");
  }

  let authorizationCodeUrl =
    APP_SERVER_CONSTANTS.instagram.authorizationCodeUrl;

  authorizationCodeUrl += `?client_id=${APP_SERVER_CONSTANTS.instagram.clientId}`;
  authorizationCodeUrl += `&redirect_uri=${APP_SERVER_CONSTANTS.redirectUri(
    "/api/instagram-auth/callback"
  )}`;
  authorizationCodeUrl += `&response_type=code`;
  authorizationCodeUrl += `&scope=${APP_SERVER_CONSTANTS.instagram.scopes.join(
    ","
  )}`;

  const supabase = await createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session?.user.id) {
    console.log("User not found", sessionError);

    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return NextResponse.json({ url: authorizationCodeUrl });
}
