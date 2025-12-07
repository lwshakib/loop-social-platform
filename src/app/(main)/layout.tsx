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
    <div className="flex min-h-screen bg-background font-sans">
      <UserProvider user={user} />
      <LeftSidebar />
      {children}
    </div>
  );
}
