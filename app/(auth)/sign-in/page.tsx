'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AuthLayout from '@/components/auth/AuthLayout';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: '/',
    });

    if (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } else if (data) {
      toast.success('Successfully signed in!');
      router.push('/');
    }
    setLoading(false);
  };

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    await authClient.signIn.social({
      provider,
      callbackURL: '/',
    });
  };

  return (
    <AuthLayout imageSrc="/images/signin-bg.png" imagePosition="left">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="mb-8 text-center lg:text-left">
          <h2 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">Sign In</h2>
          <p className="text-muted-foreground text-lg">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground tracking-wider">
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
              <label className="text-sm font-semibold text-muted-foreground tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
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
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
          <span className="relative px-4 text-xs font-bold text-muted-foreground tracking-widest bg-background">
            Or Continue With
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSocialSignIn('google')}
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
              GitHub{' '}
              <span className="text-[10px] block lg:inline-block font-normal">
                (Unavailable)
              </span>
            </span>
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-muted-foreground font-medium">
            New to Loop?{' '}
            <Link
              href="/sign-up"
              className="text-primary hover:text-primary/80 font-bold transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

