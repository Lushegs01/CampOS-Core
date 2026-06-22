"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";
import { Bell, Search, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";

interface TopBarProps {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    roles?: string[];
  };
  unreadCount?: number;
  onMenuClick?: () => void;
}

export function TopBar({ user, unreadCount = 0, onMenuClick }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className={cn("relative", searchOpen ? "w-64" : "w-auto")}>
          {searchOpen ? (
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-9 rounded-lg bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
              onBlur={() => setSearchOpen(false)}
            />
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Link href={user?.roles?.includes("admin") ? "/admin/notifications" : "/student/notifications"}>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user ? `${user.firstName} ${user.lastName}` : "User"}</p>
            <p className="text-xs text-muted-foreground">{user?.roles?.[0] || "Student"}</p>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>{user ? getInitials(`${user.firstName} ${user.lastName}`) : "U"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
