import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../database.types";

export type SupabaseClientType = SupabaseClient<Database>;

export interface MediaUrls {
  fileUrl: string;
  coverUrl?: string;
}

export interface PlatformAccountData {
  id: string;
  access_token: string | null;
  platform_user_id: string | null;
  token_expires_at: string | null;
  refresh_token: string | null;
  refresh_token_expires_at: string | null;
}

export interface UploadPlatformResponse {
  success: boolean;
  postURL?: string;
  error?: string | null;
}

export type PostContentResponse = Record<string, UploadPlatformResponse>;

export default class PostgrestError extends Error {
  details: string;
  hint: string;
  code: string;

  constructor(context: {
    message: string;
    details: string;
    hint: string;
    code: string;
  }) {
    super(context.message);
    this.name = "PostgrestError";
    this.details = context.details;
    this.hint = context.hint;
    this.code = context.code;
  }
}
