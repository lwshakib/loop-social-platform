"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Github,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/",
    });

    if (error) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } else if (data) {
      toast.success("Successfully signed in!");
      router.push("/");
    }
    setLoading(false);
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-primary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 w-full max-w-250 p-4 lg:p-8"
      >
        <div className="grid lg:grid-cols-2 bg-card/50 backdrop-blur-xl border border-border rounded-[2rem] overflow-hidden shadow-2xl">
          {/* Brand Side */}
          <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-card">
            <div className="absolute inset-0 z-0">
              <img
                src="/images/auth-bg.png"
                alt="Auth background"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-linear-to-br from-card/80 via-transparent to-card/80" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-12">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <div className="w-5 h-5 border-2 border-primary-foreground rounded-full" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  Loop
                </span>
              </div>

              <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
                Connect with the <span className="text-primary">world</span> in
                a better way.
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-sm">
                Join our community to share your thoughts, discover new ideas,
                and keep your friends in the loop.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: <Zap className="w-5 h-5 text-yellow-400" />,
                    text: "Real-time updates and notifications",
                  },
                  {
                    icon: <Globe className="w-5 h-5 text-blue-400" />,
                    text: "Connect with creators worldwide",
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
                    text: "Secured with end-to-end encryption",
                  },
                ].map((item, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    key={i}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-foreground/80 font-medium">
                      {item.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-12 pt-8 border-t border-border/50">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-card bg-muted overflow-hidden"
                    >
                      <img
                        src={`https://i.pravatar.cc/150?u=${i}`}
                        alt="user"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground font-medium italic">
                  Join 10k+ active users
                </span>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary-foreground rounded-full" />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Loop
                </span>
              </div>

              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Welcome Back
                </h2>
                <p className="text-muted-foreground font-medium">
                  Please enter your details to sign in.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-muted/30 border border-border rounded-xl py-3.5 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      href="#"
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-muted/30 border border-border rounded-xl py-3.5 pl-12 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <span className="relative px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-card">
                  Or Continue With
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSocialSignIn("google")}
                  className="flex items-center justify-center gap-3 bg-muted/30 hover:bg-muted/50 border border-border rounded-xl py-3 text-foreground transition-all group"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    alt="Google"
                  />
                  <span className="font-semibold">Google</span>
                </button>
                <button
                  disabled
                  className="flex items-center justify-center gap-3 bg-muted/20 border border-border/10 rounded-xl py-3 text-muted-foreground cursor-not-allowed transition-all group"
                  title="Coming soon"
                >
                  <Github className="w-5 h-5 opacity-50" />
                  <span className="font-semibold text-sm">
                    GitHub{" "}
                    <span className="text-[10px] block lg:inline-block font-normal">
                      (Unavailable)
                    </span>
                  </span>
                </button>
              </div>

              <div className="mt-10 text-center">
                <p className="text-muted-foreground font-medium">
                  New to Loop?{" "}
                  <Link
                    href="/sign-up"
                    className="text-primary hover:text-primary/80 font-bold transition-colors"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
