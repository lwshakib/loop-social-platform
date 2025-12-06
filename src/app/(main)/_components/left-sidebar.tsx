"use client";

import {
  Home as HomeIcon,
  Search,
  Compass,
  Play,
  Send,
  Bell,
  PlusSquare,
  Sidebar,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { NavItem } from "./nav-item";
import { SidebarLogo } from "./sidebar-logo";

export function LeftSidebar() {
  const pathname = usePathname();
  const isHomeActive = pathname === "/";

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-background">
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-start px-6 py-4">
          <SidebarLogo />
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 space-y-1">
          <NavItem icon={HomeIcon} label="Home" isActive={isHomeActive} />
          <NavItem icon={Search} label="Search" />
          <NavItem icon={Compass} label="Explore" />
          <NavItem icon={Play} label="Reels" />
          <NavItem icon={Send} label="Messages" />
          <NavItem icon={Bell} label="Notifications" badge={3} />
          <NavItem icon={PlusSquare} label="Create" />
          <NavItem
            label="Profile"
            avatar={
              <Avatar className="h-6 w-6">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                <AvatarFallback className="text-xs">U</AvatarFallback>
              </Avatar>
            }
          />
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Username</span>
                <span className="text-xs text-muted-foreground">@username</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <ModeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
