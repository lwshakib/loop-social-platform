'use client';

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  imageSrc: string;
  imagePosition?: 'left' | 'right';
}

export default function AuthLayout({
  children,
  imageSrc,
  imagePosition = 'left',
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden items-stretch">
      <div className="flex flex-col lg:flex-row w-full items-stretch">
        {/* Image Side */}
        <div
          className={`relative hidden lg:block flex-1 overflow-hidden ${
            imagePosition === 'right' ? 'lg:order-2' : 'lg:order-1'
          }`}
        >
          <img src={imageSrc} alt="Auth background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20" /> {/* Subtle overlay for depth */}
          <div className="absolute top-12 left-12 z-10 flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <div className="w-5 h-5 border-2 border-primary-foreground rounded-full" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              Loop
            </span>
          </div>
        </div>

        {/* Form Side */}
        <div
          className={`flex-1 p-8 lg:p-12 flex flex-col justify-center bg-background min-h-screen ${
            imagePosition === 'right' ? 'lg:order-1' : 'lg:order-2'
          }`}
        >
          <div className="max-w-md mx-auto w-full">
            <div className="flex lg:hidden items-center gap-2 mb-12 justify-center">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary-foreground rounded-full" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">Loop</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
