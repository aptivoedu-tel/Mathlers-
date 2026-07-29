"use client";

import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main
      className={cn(
        "transition-all duration-300 min-h-screen bg-[#F8F9FB] p-6 pt-16 md:pt-8",
        collapsed ? "md:pl-[calc(68px+1.5rem)]" : "md:pl-[calc(260px+1.5rem)]"
      )}
    >
      <div className="max-w-screen-xl mx-auto">
        {children}
      </div>
    </main>
  );
}
