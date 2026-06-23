"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Zap, Rocket } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isCognitoConfigured } from "@/lib/auth-config";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-amber-700 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-700 dark:text-slate-300 hidden sm:block max-w-24 truncate">
            {user.displayName}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300"
      >
        <DropdownMenuLabel className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{user.displayName}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 font-normal">{user.email}</p>
          <div className="flex items-center gap-1 pt-1">
            <Badge
              variant="outline"
              className="text-xs border-amber-400 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 capitalize"
            >
              <Zap className="w-3 h-3 mr-1" />
              {user.plan} plan
            </Badge>
            {!isCognitoConfigured && (
              <Badge
                variant="outline"
                className="text-xs border-gray-300 dark:border-slate-700 text-gray-400 dark:text-slate-500"
              >
                Dev mode
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-800" />

        <DropdownMenuItem
          onClick={() => router.push("/plans")}
          className="text-amber-600 dark:text-amber-400 focus:bg-amber-50 dark:focus:bg-amber-950/30 focus:text-amber-700 dark:focus:text-amber-300 cursor-pointer font-medium"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Upgrade your plan
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/profile")}
          className="text-gray-700 dark:text-slate-300 focus:bg-gray-100 dark:focus:bg-slate-800 focus:text-gray-900 dark:focus:text-slate-100 cursor-pointer"
        >
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-800" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-500 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-600 dark:focus:text-red-300 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
