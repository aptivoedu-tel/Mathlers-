"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-card border border-gray-200/80">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-primary text-white rounded-2xl font-bold text-xl mb-4 shadow-sm">
          M
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to your Mathlers account</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@mathlers.com"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <Button
          type="submit"
          isLoading={loading}
          className="w-full py-3 mt-2"
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}
