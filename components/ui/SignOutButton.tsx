"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      className="flex items-center gap-2 p-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors w-full"
    >
      <LogOut size={16} />
      <span>Sign Out</span>
    </button>
  );
}
