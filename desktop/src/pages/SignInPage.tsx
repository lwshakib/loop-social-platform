import { useState } from "react";
import { ModeToggle } from "../components/mode-toggle";
import { WindowControls } from "../components/WindowControls";
import { DragRegion } from "../components/DragRegion";
import { Lock, Mail } from "lucide-react";
import { signIn } from "../utils/auth";
import { UserData } from "../store/userStore";

type SignInPageProps = {
  onSignIn: (userData: UserData) => void;
  onNavigate: (page: string) => void;
};

export default function SignInPage({ onSignIn, onNavigate }: SignInPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    
    // Call sign in API
    const result = await signIn(email, password);
    
    setIsSubmitting(false);
    
    if (result.success && result.userData) {
      onSignIn(result.userData);
    } else {
      setError(result.error || "Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      {/* Drag Region for window dragging */}
      <DragRegion />
      
      {/* Mode Toggle - Top Left */}
      <div className="absolute top-4 left-4 z-50" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <ModeToggle />
      </div>
      
      {/* Window Controls - Top Right */}
      <div className="absolute top-4 right-4 z-50" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <WindowControls />
      </div>
      
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Loop
          </h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Sign in to continue
          </p>
        </div>

        <div className="border-2 shadow-lg rounded-lg bg-card">
          <div className="space-y-1 pb-4 px-6 pt-6">
            <h2 className="text-2xl font-semibold text-center">Sign In</h2>
            <p className="text-center text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>
          
          <div className="space-y-6 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Password</label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="remember" className="text-sm cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>
              
              {error && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 font-semibold text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <button
                onClick={() => onNavigate("signup")}
                className="font-semibold text-primary hover:underline"
              >
                Sign up for free
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground px-2">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

