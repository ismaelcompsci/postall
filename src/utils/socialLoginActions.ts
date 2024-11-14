import "server-only";
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

interface SocialLoginParameters {
  user_id?: string;
  platform?: string;
  platform_username?: string;
  platform_profile_picture_url?: string;
  platform_user_id?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
}

export const insertSocialLogin = async (
  supabase: SupabaseClient,
  {
    user_id,
    platform,
    access_token,
    refresh_token,
    token_expires_at,
    platform_username,
    platform_profile_picture_url,
    platform_user_id,
  }: SocialLoginParameters
): Promise<PostgrestError | null> => {
  const {
    data,
    count,
    error: findError,
  } = await supabase
    .from("social_connections")
    .select("user_id, platform, platform_user_id, id", {
      count: "exact",
    })
    .eq("user_id", user_id)
    .eq("platform", platform)
    .eq("platform_user_id", platform_user_id)
    .limit(1)
    .maybeSingle();

  if (findError) {
    return findError;
  }

  let error: PostgrestError | null;
  if (count === 0) {
    const { error: insertError } = await supabase
      .from("social_connections")
      .insert({
        user_id,
        access_token,
        refresh_token,
        platform,
        token_expires_at,
        platform_username,
        platform_profile_picture_url,
        platform_user_id,
      });

    error = insertError;
  } else if (data) {
    const { error: updateError } = await supabase
      .from("social_connections")
      .update({
        access_token,
        refresh_token,
        token_expires_at,
        platform_username,
        platform_profile_picture_url,
        platform_user_id,
      })
      .eq("id", data.id);

    error = updateError;
  } else {
    throw new Error("Failed to inser new Social login");
  }

  return error;
};
