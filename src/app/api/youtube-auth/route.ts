import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { APP_SERVER_CONSTANTS } from "@/utils/constants";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session?.user.id) {
    console.log("User not found", sessionError);

    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  if (!APP_SERVER_CONSTANTS.youtube.clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not set");
  }

  if (!APP_SERVER_CONSTANTS.youtube.clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is not set");
  }

  const params: { [key: string]: string } = {
    client_id: APP_SERVER_CONSTANTS.youtube.clientId,
    redirect_uri: APP_SERVER_CONSTANTS.redirectUri(
      "/api/youtube-auth/callback"
    ),
    response_type: "code",
    scope: APP_SERVER_CONSTANTS.youtube.scopes.join(" "),
    access_type: "offline",
  };

  const query = Object.keys(params)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");

  const url = `${APP_SERVER_CONSTANTS.youtube.authorizationCodeUrl}?${query}`;

  return NextResponse.json({ url });
}
