import { getURL } from "@/lib/utils";
import "server-only";

export const APP_SERVER_CONSTANTS = {
  instagram: {
    authorizationCodeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    scopes: [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "business_management",
    ],
  },
  tiktok: {
    authorizationCodeUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open-platform.tiktokapis.com/v2/oauth/token/",
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    scopes: ["user.info.basic", "video.publish", "video.upload", "video.list"],
  },
  youtube: {
    authorizationCodeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/youtube.force-ssl",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
  },

  redirectUri: (path: string) => {
    if (process.env.NODE_ENV === "development") {
      return `http://localhost:3000${path}`;
    }

    return `${getURL(path)}`;
  },
};
