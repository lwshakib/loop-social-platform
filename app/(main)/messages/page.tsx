'use client';

import { Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function MessagesPage() {
  return (
    <main className="flex-1 min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-muted/50">
          <Send className="h-10 w-10 text-muted-foreground/40 -rotate-12" />
          <div className="absolute inset-0 border-2 border-dashed border-muted-foreground/20 rounded-full animate-[spin_10s_linear_infinite]" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground text-sm">
            This service is not available right now. We&apos;re working on bringing real-time conversations to Loop.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/5 opacity-50 grayscale">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs uppercase">
                J
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left space-y-1">
              <div className="h-3 w-24 bg-muted rounded-full" />
              <div className="h-2 w-32 bg-muted/60 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/5 opacity-30 grayscale translate-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs uppercase">
                A
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left space-y-1">
              <div className="h-3 w-20 bg-muted rounded-full" />
              <div className="h-2 w-28 bg-muted/60 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
