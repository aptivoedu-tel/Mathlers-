import NextAuthProvider from '@/components/auth/NextAuthProvider';
import type { Metadata } from "next";
import { Inter, Sail } from "next/font/google";
import "./globals.css";
import ThemeProvider from '@/components/theme/ThemeProvider';
import { getSiteTheme } from '@/lib/theme/siteTheme';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const sail = Sail({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sail",
});

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
    <html lang="en" className={`h-full antialiased ${inter.variable} ${sail.variable}`}>
      <body className={`min-h-full flex flex-col ${inter.className}`}>
        <NextAuthProvider>
          <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}