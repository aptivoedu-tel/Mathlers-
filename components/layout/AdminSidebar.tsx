"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, School, BookOpen,
  Target, FileText, Trophy, Award,
  BarChart3, Bell, Settings, Layers3,
  Code2, ChevronLeft, ChevronRight, Menu, X, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useSidebar } from "./SidebarContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",        href: "/admin/dashboard" },
  { icon: Users,           label: "Students",          href: "/admin/students" },
  { icon: School,          label: "Schools",           href: "/admin/schools" },
  { icon: BookOpen,        label: "Learning",          href: "/admin/learning" },
  { icon: Target,          label: "Question Bank",     href: "/admin/questions" },
  { icon: Layers3,         label: "Subjects & Topics", href: "/admin/content" },
  { icon: FileText,        label: "Practice Sets",     href: "/admin/practice" },
  { icon: Trophy,          label: "Competitions",      href: "/admin/competitions" },
  { icon: Award,           label: "Results",           href: "/admin/results" },
  { icon: BarChart3,       label: "Analytics",         href: "/admin/analytics" },
  { icon: Bell,            label: "Notifications",     href: "/admin/notifications" },
  { icon: Settings,        label: "Settings",          href: "/admin/settings" },
];

const superAdminItems = [
  { icon: Code2, label: "Developer", href: "/admin/developer" },
];

interface AdminSidebarProps {
  isSuperAdmin?: boolean;
}

export default function AdminSidebar({ isSuperAdmin = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const allItems = isSuperAdmin ? [...menuItems, ...superAdminItems] : menuItems;

  const NavItems = () => (
    <nav className="scrollbar-hide min-h-0 flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {allItems.map((item) => {
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
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
      <Link href="/admin/dashboard" className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 shrink-0 bg-brand-primary rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-sm font-bold text-white truncate block">Mathlers</span>
            <p className="text-xs text-slate-400 truncate">Admin Portal</p>
          </div>
        )}
      </Link>
      {showToggle && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}
    </div>
  );

  const Footer = () => (
    <div className={cn("shrink-0 border-t border-slate-800 p-3", collapsed ? "flex justify-center" : "")}>
      <button
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        title="Sign out"
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all",
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-950 text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "md:hidden fixed left-0 top-0 z-50 h-dvh w-64 flex flex-col bg-slate-950 text-slate-100 shadow-2xl transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
        <div className="flex min-h-0 flex-1 flex-col">
          <Header showToggle={false} />
          <div className="mx-4 border-t border-slate-800" />
          <NavItems />
          <Footer />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex fixed left-0 top-0 z-50 h-dvh flex-col bg-slate-950 text-slate-100 border-r border-slate-800 transition-all duration-300 overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex min-h-0 flex-1 flex-col">
          <Header />
          <div className={cn("mx-3 border-t border-slate-800", collapsed && "mx-2")} />
          <NavItems />
          <Footer />
        </div>
      </aside>
    </>
  );
}
