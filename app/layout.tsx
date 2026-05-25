import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { MobileShell } from "@/components/layout/mobile-shell";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "AI Trainer",
  description: "Mobile-first AI training tasks powered by human feedback",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <MobileShell>{children}</MobileShell>
      </body>
    </html>
  );
}
