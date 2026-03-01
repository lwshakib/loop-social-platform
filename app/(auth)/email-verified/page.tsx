'use client';

import { buttonVariants } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function EmailVerifiedPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6">
      <div className="p-4 bg-green-500/10 rounded-full">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter text-green-600 dark:text-green-400">
          Email Verified!
        </h1>
        <p className="text-muted-foreground text-lg max-w-[400px]">
          Your account has been successfully verified. You can now log in to access all the features
          of Loop.
        </p>
      </div>

      <div className="flex flex-col w-full gap-3 pt-4">
        <Link
          href="/sign-in"
          className={buttonVariants({
            variant: 'default',
            size: 'lg',
            className: 'w-full text-md font-semibold',
          })}
        >
          Back to Login
        </Link>
      </div>

      <p className="text-sm text-muted-foreground pt-4">Welcome to the community!</p>
    </div>
  );
}
