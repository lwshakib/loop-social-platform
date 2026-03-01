'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: password,
    });

    if (error) {
      toast.error(error.message || 'Failed to reset password.');
    } else {
      setIsSuccess(true);
      toast.success('Password successfully reset!');
    }
    setLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 w-full max-w-md p-8 bg-card/50 backdrop-blur-xl border border-border rounded-[2rem] shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Password Reset</h2>
            <p className="text-muted-foreground text-lg">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Link
              href="/sign-in"
              className={buttonVariants({
                variant: 'default',
                size: 'lg',
                className: 'w-full text-md font-semibold text-white',
              })}
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-primary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 w-full max-w-md p-8 bg-card/50 backdrop-blur-xl border border-border rounded-[2rem] shadow-2xl"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Reset Password</h2>
          <p className="text-muted-foreground font-medium">Set your new secure password below.</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              New Password
            </label>
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

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-muted/30 border border-border rounded-xl py-3.5 pl-12 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
              />
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
                Update Password
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
