'use client';

import { buttonVariants } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import AuthLayout from '@/components/auth/AuthLayout';

/**
 * VerifyEmailPage Component
 * This page serves as a landing destination after a user's email has been verified.
 * It provides a confirmation message and a quick link back to the login page.
 */
export default function VerifyEmailPage() {
  return (
    <AuthLayout imageSrc="/images/email-verified-bg.png" imagePosition="right">
      <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
        {/* Success checkmark icon with theme-based green color */}
        <div className="p-4 bg-green-500/10 rounded-full mx-auto lg:mx-0">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
            Email Verified!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your account has been successfully verified. You can now log in to access all the
            features of Loop.
          </p>
        </div>

        {/* Action button to redirect user back to authentication */}
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

        {/* Footer welcome message */}
        <p className="text-sm text-muted-foreground pt-4">Welcome to the community!</p>
      </div>
    </AuthLayout>
  );
}
