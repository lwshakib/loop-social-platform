'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });

    if (error) {
      toast.error(error.message || 'Failed to send reset email.');
    } else {
      setIsSent(true);
      toast.success('Password reset email sent!');
    }
    setLoading(false);
  };

  if (isSent) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 w-full max-w-md p-8 bg-card/50 backdrop-blur-xl border border-border rounded-[2rem] shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Email Sent</h2>
            <p className="text-muted-foreground">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-semibold text-foreground">{email}</span>.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
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
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-2">Forgot Password</h2>
          <p className="text-muted-foreground font-medium">
            Enter your email to receive a reset link.
          </p>
        </div>

        <form onSubmit={handleRequestReset} className="space-y-5">
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
                Send Reset Link
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
