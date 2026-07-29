"use client";

import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main
      className={cn(
        "transition-all duration-300 min-h-screen p-6 pt-16 md:pt-8",
        collapsed ? "md:pl-20" : "md:pl-68"
      )}
    >
      <div className="max-w-screen-xl mx-auto">
        {children}
      </div>
    </main>
  );
}
