import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { User } from "@supabase/supabase-js";

import { SidebarFooterUserButton } from "./sidebar-footer";
import { CircleUser, FilePlus, GalleryHorizontalEnd } from "lucide-react";
import Link from "next/link";

export function AppSidebar({ user }: { user: User }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <SiteNameAndLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Upload</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard">
                    <FilePlus />
                    <span>New Post</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Accounts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/connected-accounts">
                    <CircleUser />
                    <span>Connected Accounts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterUserButton user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

export const SiteNameAndLogo = () => {
  return (
    <div className="font-gesit-mono flex flex-row items-center gap-2">
      <GalleryHorizontalEnd className="w-6 h-6" />
      <span className="text-lg font-semibold">PostAll</span>
    </div>
  );
};
