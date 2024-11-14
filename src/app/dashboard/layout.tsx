import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className=" w-screen">
        {/* header */}
        <div className="flex justify-between items-center p-2 bg-sidebar">
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
