"use client";

import {
  Compass,
  Home as HomeIcon,
  Play,
  PlusSquare,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSocialStore } from "@/context";

const NAV_ITEMS = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/reels", icon: Play, label: "Reels" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/create", icon: PlusSquare, label: "Create" },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const user = useSocialStore((state) => state.user);

  const profileHref = user?.username ? `/${user.username}` : "/auth/sign-in";
  const activeMatch = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-3 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors",
              activeMatch(href) && "text-primary"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                activeMatch(href) && "stroke-[2.25] fill-primary/10"
              )}
            />
            <span className="sr-only sm:not-sr-only sm:leading-none">
              {label}
            </span>
          </Link>
        ))}

        <Link
          href={profileHref}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors",
            activeMatch(profileHref) && "text-primary"
          )}
        >
          <Avatar className="h-6 w-6 border border-border">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback className="text-[10px]">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only sm:not-sr-only sm:leading-none">
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}
