"use client";

import {
  redirect,
  RedirectType,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  AccountResponse,
  AccountType,
  ConnectedAccountsProps,
  RemoveAccountParams,
} from "../../lib/types";
import { createClient } from "@/utils/supabase/client";
import { InstagramChooseAccountsDialog } from "./instagram-choose-accounts-dialog";
import { AccountSection } from "./account-section";

export const ConnectedAccounts = ({ accounts }: ConnectedAccountsProps) => {
  const supabse = createClient();
  const router = useRouter();

  const searchParams = useSearchParams();
  const instagramAccounts = searchParams.get("instagram_accounts");
  const instagramToken = searchParams.get("instagram_token");

  const [newInstagramAccounts, setNewInstagramAccounts] =
    useState<AccountResponse | null>(null);

  const checkParams = () => {
    if (instagramAccounts && instagramToken) {
      const accounts: AccountResponse = JSON.parse(
        decodeURIComponent(instagramAccounts)
      );

      setNewInstagramAccounts(accounts);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  useEffect(() => {
    checkParams();
  }, []);

  const authenticateWithYoutube = async () => {
    const response = await fetch("/api/youtube-auth");
    const data: { url: string } = await response.json();
    redirect(data.url, RedirectType.push);
  };

  const authenticateWithTiktok = async () => {
    const response = await fetch("/api/tiktok-auth");
    const data: { url: string } = await response.json();
    redirect(data.url, RedirectType.push);
  };

  const authenticateWithInstagram = async () => {
    const response = await fetch("/api/instagram-auth");
    const data: { url: string } = await response.json();
    redirect(data.url, RedirectType.push);
  };

  const authenticateAccount = async (accountType: AccountType) => {
    switch (accountType) {
      case "youtube":
        await authenticateWithYoutube();
        break;
      case "tiktok":
        await authenticateWithTiktok();
        break;
      case "instagram":
        await authenticateWithInstagram();
        break;
    }
  };

  const removeAccount = async ({ id }: RemoveAccountParams): Promise<void> => {
    const {
      data: { user },
    } = await supabse.auth.getUser();
    const user_id = user?.id;

    if (!user_id) {
      toast.error("Could not remove account. Try Again Later!");
      return;
    }

    const { error } = await supabse
      .from("social_connections")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id);

    if (error) {
      toast.error("Could not remove account. Try Again Later!");
      return;
    }

    router.replace("/dashboard/connected-accounts");
  };

  return (
    <div className="flex flex-col space-y-6">
      <AccountSection
        title="YouTube"
        accountType="youtube"
        accounts={accounts}
        onAuthenticate={authenticateAccount}
        removeAccount={removeAccount}
      />
      <AccountSection
        title="TikTok"
        accountType="tiktok"
        accounts={accounts}
        onAuthenticate={authenticateAccount}
        removeAccount={removeAccount}
      />
      <AccountSection
        title="Instagram"
        accountType="instagram"
        accounts={accounts}
        onAuthenticate={authenticateAccount}
        removeAccount={removeAccount}
      />

      <InstagramChooseAccountsDialog accounts={newInstagramAccounts} />
    </div>
  );
};
