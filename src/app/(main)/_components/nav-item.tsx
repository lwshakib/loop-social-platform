"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItemProps = {
  icon?: LucideIcon;
  label: string;
  badge?: number;
  avatar?: ReactNode;
  className?: string;
  isActive?: boolean;
};

export function NavItem({
  icon: Icon,
  label,
  badge,
  avatar,
  className,
  isActive = false,
}: NavItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 h-12 text-base font-medium",
        isActive && "bg-accent font-semibold",
        className
      )}
    >
      {avatar ? (
        avatar
      ) : Icon ? (
        <div className="relative">
          <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
      ) : null}
      <span>{label}</span>
    </Button>
  );
}
