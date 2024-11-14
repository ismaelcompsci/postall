export type AccountType = "youtube" | "tiktok" | "instagram";

export interface RemoveAccountParams {
  id: string;
}

export interface AccountSectionProps {
  title: string;
  accountType: AccountType;
  accounts: ConnectedAccountsProps["accounts"];
  onAuthenticate: (accountType: AccountType) => Promise<void>;
  removeAccount: (args: RemoveAccountParams) => Promise<void>;
}

export interface ConnectedAccountsProps {
  accounts:
    | {
        platform_username: string | null;
        platform: string | null;
        platform_profile_picture_url: string | null;
        id: string;
      }[]
    | null;
}

export interface Account {
  instagram_id: string;
  instagram_name: string;
  instagram_username: string;
  instagram_profile_picture_url: string;
  instagram_access_token: string;
  page_name: string;
  page_id: string;
}

export type AccountResponse = Account[];

export interface PlatformToUpload {
  name: string;
  accountIds: string[];
}
