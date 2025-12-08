import { getOrCreateUser } from "@/actions/user";
import { LeftSidebar } from "./_components/left-sidebar";
import { UserProvider } from "./_components/user-provider";
import { User } from "@/types";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbUser = await getOrCreateUser();

  // Map database user to User type
  const user: User | null = dbUser
    ? {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        imageUrl: dbUser.imageUrl,
        bio: dbUser.bio || "",
        dateOfBirth: dbUser.dateOfBirth ? String(dbUser.dateOfBirth) : "",
        gender: dbUser.gender || "",
        isVerified: dbUser.isVerified || false,
      }
    : null;

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <UserProvider user={user} />
      <LeftSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
