"use server";

import { getURL } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { Provider } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function oAuthLogin(provider: Provider) {
  if (!provider) {
    console.error("No provider provided");
    redirect("/login");
  }

  const supabase = await createClient();
  // TODO: CHANGE THIS TO THE PROPER URL
  const redirectURI = getURL("/auth/callback");

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirectURI,
    },
  });

  if (error) {
    console.error("Error logging in", error);
    redirect("/login");
  }

  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
