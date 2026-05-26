import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { MobileShell } from "@/components/layout/mobile-shell";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Mobile-first AI training tasks powered by human feedback",
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
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
        <RegisterServiceWorker />
        <MobileShell>{children}</MobileShell>
      </body>
    </html>
  );
}
