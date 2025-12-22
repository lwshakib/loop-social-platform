import { LeftSidebar } from "./_components/left-sidebar";
import { MobileNav } from "./_components/mobile-nav";
import { UserProvider } from "./_components/user-provider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <UserProvider user={session?.user} />
      <LeftSidebar />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
