import NextAuthProvider from '@/components/auth/NextAuthProvider';
import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from '@/components/theme/ThemeProvider';
import { getSiteTheme } from '@/lib/theme/siteTheme';

export const metadata: Metadata = {
  title: "Mathlers",
  description: "Mathematics learning, practice, and competition platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getSiteTheme();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextAuthProvider>
          <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}