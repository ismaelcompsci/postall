import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../ui/alert-dialog";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { SocialAvatar } from "./social-avatar";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { AccountResponse } from "@/lib/types";

export const InstagramChooseAccountsDialog = ({
  accounts,
}: {
  accounts?: AccountResponse | null;
}) => {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountsAdded, setAccountsAdded] = useState<AccountResponse>([]);

  useEffect(() => {
    if (accounts) {
      setOpen(true);
    }
  }, [accounts]);

  const addNewInstagramAccounts = async () => {
    if (accountsAdded.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw Error("No authenticated user found");
      }

      const sixtyDaysInMilliseconds = 60 * 24 * 60 * 60 * 1000;

      for (const account of accountsAdded) {
        const { error } = await supabase.from("social_connections").insert({
          user_id: user.id,
          platform: "instagram",
          platform_username: account.instagram_username,
          platform_profile_picture_url: account.instagram_profile_picture_url,
          platform_user_id: account.instagram_id,
          page_id: account.page_id,
          page_name: account.page_name,
          access_token: account.instagram_access_token,
          token_expires_at: new Date(
            Date.now() + sixtyDaysInMilliseconds
          ).toISOString(),
        });

        console.log(error);

        if (error) throw error;

        router.refresh();
      }
    } catch (e) {
      console.error("Error connecting Instagram accounts", e);
      toast.error("Error connecting Instagram accounts", {});
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choose Instagram Accounts</AlertDialogTitle>
          <AlertDialogDescription>
            Choose the Instagram Bussiness/Creator accounts you would like to
            connect.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {accounts &&
          accounts.map((acc) => (
            <div key={acc.instagram_id} className="">
              <Label
                htmlFor={acc.instagram_id}
                className="flex flex-row items-center gap-4 bg-muted/50 p-4 rounded-lg hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  id={acc.instagram_id}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setAccountsAdded((state) => [...state, acc]);
                    } else {
                      setAccountsAdded((state) =>
                        state.filter(
                          (oldAcc) => oldAcc.instagram_id != acc.instagram_id
                        )
                      );
                    }
                  }}
                />

                <div className="flex items-center gap-2">
                  <SocialAvatar
                    profile_picture_url={acc.instagram_profile_picture_url}
                    username={acc.instagram_username}
                  />
                  @{acc.instagram_username}
                </div>
              </Label>
            </div>
          ))}

        {!accounts && (
          <p className="">
            No Instagram accounts found. Please make sure you have a Business or
            Creator account connected to your Facebook Page.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setOpen(false);
              router.replace("/dashboard/connected-accounts", {});
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={addNewInstagramAccounts}
            disabled={!accounts || accountsAdded.length === 0}
          >
            {loading ? "Connecting..." : `Connect (${accountsAdded.length})`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
