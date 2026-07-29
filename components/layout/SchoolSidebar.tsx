"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  BarChart3, Bell, Settings, ChevronLeft, ChevronRight, Menu, X, LogOut, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useSidebar } from "./SidebarContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/school/dashboard" },
  { icon: Users,           label: "Students",    href: "/school/students" },
  { icon: GraduationCap,   label: "Teachers",    href: "/school/teachers" },
  { icon: Trophy,          label: "Challenges",  href: "/school/challenges" },
  { icon: BookOpen,        label: "Practice Books", href: "/school/practice-books" },
  { icon: BarChart3,       label: "Performance", href: "/school/performance" },
  { icon: Bell,            label: "Notifications",href: "/school/notifications" },
  { icon: Settings,        label: "Settings",    href: "/school/settings" },
];

export default function SchoolSidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const NavItems = () => (
    <nav className="scrollbar-hide min-h-0 flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
      {menuItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
              collapsed ? "justify-center" : "",
              isActive
                ? "bg-brand-lighter/60 text-brand-primary font-semibold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className={cn(
              "w-[18px] h-[18px] shrink-0 transition-colors",
              isActive ? "text-brand-primary" : "text-gray-400 group-hover:text-gray-600"
            )} />
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
      <Link href="/school/dashboard" className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 shrink-0 bg-brand-primary rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate block">Mathlers</span>
            <p className="text-[11px] text-gray-400 truncate">School Portal</p>
          </div>
        )}
      </Link>
      {showToggle && !collapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors shrink-0 shadow-xs"
          title="Collapse"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}
      {showToggle && collapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors shrink-0 shadow-xs"
          title="Expand"
        >
          <ChevronRight className="w-3.5 h-3.5" />
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
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all",
          collapsed ? "justify-center" : "w-full"
        )}
      >
        <LogOut className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && <span>Sign out</span>}
      </button>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white text-gray-700 shadow-md border border-gray-200"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "md:hidden fixed left-0 top-0 z-50 h-dvh w-64 flex flex-col bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
        <div className="flex min-h-0 flex-1 flex-col">
          <Header showToggle={false} />
          <div className="mx-4 border-t border-gray-100" />
          <NavItems />
          <Footer />
        </div>
      </aside>

      <aside className={cn(
        "hidden md:flex fixed left-0 top-0 z-50 h-dvh flex-col bg-white border-r border-gray-200 shadow-sidebar transition-all duration-300 overflow-hidden",
        collapsed ? "w-[68px]" : "w-[260px]"
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
