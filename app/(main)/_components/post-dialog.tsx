"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function PostDialog({
  open,
  onOpenChange,
  children,
  className,
  showCloseButton = true,
}: PostDialogProps) {
  React.useEffect(() => {
    // Prevent body scroll when dialog is open
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog Content */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "relative w-full max-w-6xl max-h-[95vh] bg-background rounded-lg overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200",
            "flex flex-col"
          )}
        >
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 border border-border/50"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          {children}
        </div>
      </div>
    </>
  );
}
