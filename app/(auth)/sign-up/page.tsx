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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-125 h-125 bg-indigo-600/10 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-100 h-100 bg-purple-600/10 blur-[100px] rounded-full translate-y-1/2 translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-250 p-4 lg:p-8"
      >
        <div className="grid lg:grid-cols-2 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          {/* Brand Side - Flipped position for variety */}
          <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-zinc-950 lg:order-2">
            <div className="absolute inset-0 z-0">
              <img
                src="/images/auth-bg.png"
                alt="Auth background"
                className="w-full h-full object-cover opacity-60 scale-x-[-1]"
              />
              <div className="absolute inset-0 bg-linear-to-bl from-zinc-950/80 via-transparent to-zinc-950/80" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-12">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <div className="w-5 h-5 border-2 border-white rounded-full" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-white">
                  Loop
                </span>
              </div>

              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                Start your <span className="text-indigo-400">journey</span> with
                us today.
              </h1>
              <p className="text-zinc-400 text-lg mb-8 max-w-sm">
                Create an account to unlock full potential of our platform and
                start connecting with incredible people.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: <CheckCircle2 className="w-5 h-5 text-indigo-400" />,
                    text: "Customizable profile and bio",
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5 text-indigo-400" />,
                    text: "Unlimited posts and networking",
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5 text-indigo-400" />,
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
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-zinc-300 font-medium">
                      {item.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-12 pt-8 border-t border-white/5">
              <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
                <p className="text-sm text-zinc-400 italic">
                  "The best social platform I've used. The minimalist design and
                  loop mechanics are genius."
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-white">
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
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-full" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Loop
                </span>
              </div>

              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Create Account
                </h2>
                <p className="text-zinc-400 font-medium">
                  Join our community in just a few clicks.
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      Username
                    </label>
                    <div className="relative group">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="johndoe"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
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
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
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
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <span className="relative px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-[#0f0f0f]">
                  Or Join With
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSocialSignIn("google")}
                  className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-white transition-all group"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    className="w-4 h-4 group-hover:scale-110 transition-transform"
                    alt="Google"
                  />
                  <span className="text-sm font-semibold">Google</span>
                </button>
                <button
                  onClick={() => handleSocialSignIn("github")}
                  className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-white transition-all group"
                >
                  <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold">GitHub</span>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-zinc-500 font-medium text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
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
