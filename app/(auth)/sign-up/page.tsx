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
  User,
  AtSign,
  Zap,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
      username,
      callbackURL: "/",
    });

    if (error) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } else if (data) {
      toast.success("Account created successfully!");
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
      <div className="absolute top-0 left-0 w-125 h-125 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-100 h-100 bg-primary/5 blur-[100px] rounded-full translate-y-1/2 translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-250 p-4 lg:p-8"
      >
        <div className="grid lg:grid-cols-2 bg-card/50 backdrop-blur-xl border border-border rounded-[2rem] overflow-hidden shadow-2xl">
          {/* Brand Side - Flipped position for variety */}
          <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-card lg:order-2">
            <div className="absolute inset-0 z-0">
              <img
                src="/images/auth-bg.png"
                alt="Auth background"
                className="w-full h-full object-cover opacity-60 scale-x-[-1]"
              />
              <div className="absolute inset-0 bg-linear-to-bl from-card/80 via-transparent to-card/80" />
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
                Start your <span className="text-primary">journey</span> with us
                today.
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-sm">
                Create an account to unlock full potential of our platform and
                start connecting with incredible people.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
                    text: "Customizable profile and bio",
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
                    text: "Unlimited posts and networking",
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
                    text: "Priority support for creators",
                  },
                ].map((item, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
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
              <div className="p-4 bg-foreground/5 rounded-2xl backdrop-blur-md border border-border">
                <p className="text-sm text-muted-foreground italic">
                  "The best social platform I've used. The minimalist design and
                  loop mechanics are genius."
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Sarah Jenkins, Creator
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-8 lg:p-12 flex flex-col justify-center lg:order-1">
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
                  Create Account
                </h2>
                <p className="text-muted-foreground font-medium">
                  Join our community in just a few clicks.
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Username
                    </label>
                    <div className="relative group">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="johndoe"
                        required
                        className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-10 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
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
                        Sign Up
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <span className="relative px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-card">
                  Or Join With
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSocialSignIn("google")}
                  className="flex items-center justify-center gap-3 bg-muted/30 hover:bg-muted/50 border border-border rounded-xl py-3 text-foreground transition-all group"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    className="w-4 h-4 group-hover:scale-110 transition-transform"
                    alt="Google"
                  />
                  <span className="text-sm font-semibold">Google</span>
                </button>
                <button
                  disabled
                  className="flex items-center justify-center gap-3 bg-muted/20 border border-border/10 rounded-xl py-3 text-muted-foreground cursor-not-allowed transition-all group"
                  title="Coming soon"
                >
                  <Github className="w-4 h-4 opacity-50" />
                  <span className="text-sm font-semibold">
                    GitHub{" "}
                    <span className="text-[10px] block lg:inline-block font-normal">
                      (Unavailable)
                    </span>
                  </span>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground font-medium text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="text-primary hover:text-primary/80 font-bold transition-colors"
                  >
                    Sign In
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
