"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, User, CreditCard,
  Target, Trophy, TrendingUp,
  Award, FileText, Bell, Settings,
  ChevronLeft, ChevronRight, Menu, X, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useSidebar } from "./SidebarContext";

const menuItems = [
  { icon: Home,       label: "Dashboard",      href: "/student/dashboard" },
  { icon: User,       label: "My Profile",     href: "/student/profile" },
  { icon: CreditCard, label: "Player Card",    href: "/student/player-card" },
  { icon: Target,     label: "Practice Arena", href: "/student/practice" },
  { icon: Trophy,     label: "Competitions",   href: "/student/competitions" },
  { icon: TrendingUp, label: "Leaderboards",   href: "/student/leaderboard" },
  { icon: Award,      label: "Achievements",   href: "/student/achievements" },
  { icon: FileText,   label: "Certificates",   href: "/student/certificates" },
  { icon: Bell,       label: "Notifications",  href: "/student/notifications" },
  { icon: Settings,   label: "Settings",       href: "/student/settings" },
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const NavItems = () => (
    <nav className="scrollbar-hide min-h-0 flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {menuItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
              collapsed ? "justify-center" : "",
              isActive
                ? "bg-brand-primary text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-brand-primary"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const Header = ({ showToggle = true }: { showToggle?: boolean }) => (
    <div className={cn(
      "flex shrink-0 items-center gap-3 px-4 py-5",
      collapsed ? "justify-center px-2" : "justify-between"
    )}>
      <Link href="/student/dashboard" className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 shrink-0 bg-brand-primary rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate block">Mathlers</span>
            <p className="text-xs text-gray-400 truncate">Student Portal</p>
          </div>
        )}
      </Link>
      {showToggle && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors shrink-0"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}
    </div>
  );

  const Footer = () => (
    <div className={cn("shrink-0 border-t border-gray-100 p-3", collapsed ? "flex justify-center" : "")}>
      <button
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        title="Sign out"
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all",
          collapsed ? "justify-center" : "w-full"
        )}
      >
        <LogOut className="w-5 h-5 shrink-0" />
        {!collapsed && <span>Sign out</span>}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-md"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "md:hidden fixed left-0 top-0 z-50 h-dvh w-64 flex flex-col bg-white border-r border-gray-200 shadow-2xl transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>
        <div className="flex min-h-0 flex-1 flex-col">
          <Header showToggle={false} />
          <div className="mx-4 border-t border-gray-100" />
          <NavItems />
          <Footer />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex fixed left-0 top-0 z-50 h-dvh flex-col bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex min-h-0 flex-1 flex-col">
          <Header />
          <div className={cn("mx-3 border-t border-gray-100", collapsed && "mx-2")} />
          <NavItems />
          <Footer />
        </div>
      </aside>
    </>
  );
}
