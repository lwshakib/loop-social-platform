import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles } from "lucide-react";
import { UserData } from "@/store/userStore";

interface MessagesPageProps {
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userData: UserData | null;
}

export default function MessagesPage({
  onNavigate,
  onSignOut,
  userData,
}: MessagesPageProps) {
  return (
    <Layout
      onNavigate={onNavigate}
      onSignOut={onSignOut}
      userData={userData}
      currentPage="messages"
    >
      <div className="flex flex-1 items-center justify-center h-full">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold mb-2">Messages coming soon</h1>
            <p className="text-muted-foreground">
              We are building a brand new messaging experience so you can stay
              connected with the Loop community. Stay tuned!
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => onNavigate("home")}
          >
            <MessageCircle className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </Layout>
  );
}

