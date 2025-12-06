import { getOrCreateUser } from "@/actions/user";
import { LeftSidebar } from "./_components/left-sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    await getOrCreateUser();
  
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <LeftSidebar />
        {children}
      </div>
    );
}