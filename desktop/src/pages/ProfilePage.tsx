import Layout from "@/components/Layout";
import { UserData } from "@/store/userStore";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userData: UserData | null;
}

export default function ProfilePage({
  onNavigate,
  onSignOut,
  userData,
}: ProfilePageProps) {
  return (
    <Layout
      onNavigate={onNavigate}
      onSignOut={onSignOut}
      userData={userData}
      currentPage="profile"
    >
      <div className="flex flex-1 items-center justify-center h-full">
        <p className="text-lg font-semibold">My Profile</p>
      </div>
    </Layout>
  );
}

