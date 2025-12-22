"use client";

import {
  Home as HomeIcon,
  Search,
  Compass,
  Play,
  Send,
  Bell,
  PlusSquare,
  Palette,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavItem } from "./nav-item";
import { SidebarLogo } from "./sidebar-logo";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useSocialStore } from "@/context";

export function LeftSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const user = useSocialStore((state) => state.user);

  const isHomeActive = pathname === "/";
  const isSearchActive = pathname === "/search";
  const isExploreActive = pathname === "/explore";
  const isReelsActive = pathname === "/reels";
  const isMessagesActive = pathname === "/messages";
  const isNotificationsActive = pathname === "/notifications";
  const isCreateActive = pathname === "/create";
  const isProfileActive = Boolean(
    user?.username && pathname === `/${user.username}`
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setIsDarkMode(theme === "dark");
    }
  }, [theme, mounted]);

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    setTheme(checked ? "dark" : "light");
  };

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-background h-screen overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-start px-6 py-4">
          <SidebarLogo />
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 space-y-1">
          <NavItem
            icon={HomeIcon}
            label="Home"
            href="/"
            isActive={isHomeActive}
          />
          <NavItem
            icon={Search}
            label="Search"
            href="/search"
            isActive={isSearchActive}
          />
          <NavItem
            icon={Compass}
            label="Explore"
            href="/explore"
            isActive={isExploreActive}
          />
          <NavItem
            icon={Play}
            label="Reels"
            href="/reels"
            isActive={isReelsActive}
          />
          <NavItem
            icon={Send}
            label="Messages"
            href="/messages"
            isActive={isMessagesActive}
          />
          <NavItem
            icon={Bell}
            label="Notifications"
            href="/notifications"
            badge={3}
            isActive={isNotificationsActive}
          />
          <NavItem
            icon={PlusSquare}
            label="Create"
            href="/create"
            isActive={isCreateActive}
          />
          <NavItem
            label="Profile"
            href={`/${user?.username}`}
            isActive={isProfileActive}
            avatar={
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback className="text-xs">{user?.username?.slice(0, 2)}</AvatarFallback>
              </Avatar>
            }
          />

          {/* Appearance NavItem with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-base font-medium"
              >
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Appearance</h4>
                  <p className="text-sm text-muted-foreground">
                    Customize the appearance of the app
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="dark-mode"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Dark Mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Toggle dark mode on or off
                    </p>
                  </div>
                  {mounted && (
                    <Switch
                      id="dark-mode"
                      checked={isDarkMode}
                      onCheckedChange={handleDarkModeToggle}
                    />
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </nav>
      </div>
    </aside>
  );
}
