'use client';

import { buttonVariants } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';

import AuthLayout from '@/components/auth/AuthLayout';
import { ShieldCheck, MailCheck, Bell } from 'lucide-react';

export default function CheckEmailPage() {
  return (
    <AuthLayout imageSrc="/images/verify-email-bg.png" imagePosition="left">
      <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
        <div className="p-4 bg-primary/10 rounded-full mx-auto lg:mx-0">
          <Mail className="w-12 h-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Check Email</h1>
          <p className="text-muted-foreground text-lg">
            We&apos;ve sent a verification link to your email address.
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
    </AuthLayout>
  );
}

