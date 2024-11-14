import crypto from "crypto";
import { getURL } from "@/lib/utils";
import { APP_SERVER_CONSTANTS } from "@/utils/constants";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { stringToBase64URL } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  if (!APP_SERVER_CONSTANTS.tiktok.clientId) {
    throw new Error("TIKTOK_CLIENT_ID is not set");
  }

  const code_verifier = stringToBase64URL(
    crypto.pseudoRandomBytes(32).toString()
  );

  const code_challenge = crypto
    .createHash("sha256")
    .update(code_verifier)
    .digest();

  (await cookies()).set("code_verifier", code_verifier);

  let authorizationCodeUrl = APP_SERVER_CONSTANTS.tiktok.authorizationCodeUrl;

  authorizationCodeUrl += `?client_key=${APP_SERVER_CONSTANTS.tiktok.clientId}`;
  authorizationCodeUrl += `&response_type=code`;
  authorizationCodeUrl += `&scope=user.info.basic,video.publish,video.upload,video.list`;
  authorizationCodeUrl += `&redirect_uri=${APP_SERVER_CONSTANTS.redirectUri(
    "/api/tiktok-auth/callback"
  )}`;

  authorizationCodeUrl += `&code_challenge=${code_challenge}`;
  authorizationCodeUrl += `&code_challenge_method=S256`;

  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session?.user.id) {
    console.log("User not found", sessionError);
    return NextResponse.redirect(getURL("/login"));
  }

  return NextResponse.json({ url: authorizationCodeUrl });
}
