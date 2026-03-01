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
  User,
  AtSign,
  Zap,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import AuthLayout from '@/components/auth/AuthLayout';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
      username,
      callbackURL: '/verify-email',
    });

    if (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } else if (data) {
      toast.success('Account created successfully!');
      setIsSent(true);
    }
    setLoading(false);
  };

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    await authClient.signIn.social({
      provider,
      callbackURL: '/',
    });
  };

  if (isSent) {
    return (
      <AuthLayout imageSrc="/images/signup-bg.png" imagePosition="right">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6"
        >
          <div className="p-4 bg-primary/10 rounded-full mx-auto lg:mx-0">
            <Mail className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Check Email</h1>
            <p className="text-muted-foreground text-lg">
              We&apos;ve sent a verification link to <span className="font-semibold text-foreground">{email}</span>.
            </p>
          </div>

          <div className="flex flex-col w-full gap-3 pt-4">
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: 'default',
                size: 'lg',
                className: 'w-full text-md font-semibold',
              })}
            >
              Go to Gmail
            </a>
            <Link
              href="/sign-in"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'w-full text-md font-semibold',
              })}
            >
              Back to Login
            </Link>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            Didn&apos;t receive the email? Check your spam folder or try again later.
          </p>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout imageSrc="/images/signup-bg.png" imagePosition="right">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="mb-8 text-center lg:text-left">
          <h2 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">Create Account</h2>
          <p className="text-muted-foreground text-lg">Join our community in just a few clicks</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground tracking-widest">
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
              <label className="text-xs font-bold text-muted-foreground tracking-widest">
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
            <label className="text-xs font-bold text-muted-foreground tracking-widest">
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
            <label className="text-xs font-bold text-muted-foreground tracking-widest">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
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
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          <span className="relative px-4 text-[10px] font-bold text-muted-foreground tracking-widest bg-background">
            Or Join With
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSocialSignIn('google')}
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
              GitHub{' '}
              <span className="text-[10px] block lg:inline-block font-normal">
                (Unavailable)
              </span>
            </span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground font-medium text-sm">
            Already have an account?{' '}
            <Link
              href="/sign-in"
              className="text-primary hover:text-primary/80 font-bold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

