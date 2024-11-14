import { AccountType } from "@/lib/types";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa6";
import { IconType } from "react-icons/lib";

export const socialIcons: Record<AccountType, IconType> = {
  youtube: FaYoutube,
  tiktok: FaTiktok,
  instagram: FaInstagram,
};
