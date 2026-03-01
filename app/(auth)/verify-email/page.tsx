'use client';

import { buttonVariants } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6">
      <div className="p-4 bg-primary/10 rounded-full">
        <Mail className="w-12 h-12 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter">Check your email</h1>
        <p className="text-muted-foreground text-lg max-w-[400px]">
          We&apos;ve sent a verification link to your email address. Please click the link to verify
          your account.
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
    </div>
  );
}
