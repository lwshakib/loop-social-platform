'use client';

import {
  Home as HomeIcon,
  Search,
  Compass,
  Play,
  Send,
  Bell,
  PlusSquare,
  Palette,
  LogOut,
  Settings,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NavItem } from './nav-item';
import { SidebarLogo } from './sidebar-logo';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useSocialStore } from '@/context';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export function LeftSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = useSocialStore((state) => state.user);
  const router = useRouter();

  const isHomeActive = pathname === '/';
  const isSearchActive = pathname === '/search';
  const isExploreActive = pathname === '/explore';
  const isReelsActive = pathname === '/reels';
  const isMessagesActive = pathname === '/messages';
  const isNotificationsActive = pathname === '/notifications';
  const isCreateActive = pathname === '/create';
  const isSettingsActive = pathname === '/settings';
  const isProfileActive = Boolean(user?.username && pathname === `/${user.username}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme, mounted]);

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    setTheme(checked ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/sign-in');
            toast.success('Logged out successfully');
          },
        },
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
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
          <NavItem icon={HomeIcon} label="Home" href="/" isActive={isHomeActive} />
          <NavItem icon={Search} label="Search" href="/search" isActive={isSearchActive} />
          <NavItem icon={Compass} label="Explore" href="/explore" isActive={isExploreActive} />
          <NavItem icon={Play} label="Reels" href="/reels" isActive={isReelsActive} />
          <NavItem icon={Send} label="Messages" href="/messages" isActive={isMessagesActive} />
          <NavItem
            icon={Bell}
            label="Notifications"
            href="/notifications"
            isActive={isNotificationsActive}
          />
          <NavItem icon={PlusSquare} label="Create" href="/create" isActive={isCreateActive} />
          <NavItem
            label="Profile"
            href={`/${user?.username}`}
            isActive={isProfileActive}
            avatar={
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.image || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-[10px]">
                  {(user?.name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
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
                    <label htmlFor="dark-mode" className="text-sm font-medium cursor-pointer">
                      Dark Mode
                    </label>
                    <p className="text-xs text-muted-foreground">Toggle dark mode on or off</p>
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

        {/* Account and Logout Section at Bottom */}
        <div className="px-3 pb-6 mt-auto space-y-1">
          <NavItem
            icon={Settings}
            label="Account settings"
            href="/settings"
            isActive={isSettingsActive}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-base font-medium"
                disabled={isLoggingOut}
              >
                <LogOut className="h-5 w-5" />
                <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will need to sign in again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Log out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </aside>
  );
}
