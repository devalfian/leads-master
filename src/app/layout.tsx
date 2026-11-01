import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { OfflineSync } from "@/components/offline/offline-sync";

export const metadata: Metadata = {
  title: {
    default: "Call Playbooks · Sales command center",
    template: "%s · Call Playbooks",
  },
  description:
    "Pricing library and session planner for website-development cold calling in Indonesia, Australia and the United States.",
  manifest: "/manifest.webmanifest",
  applicationName: "Call Playbooks",
  appleWebApp: {
    capable: true,
    title: "Leads Master",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  // The workspace is a single-user internal tool: keep it out of search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0d14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppShell>{children}</AppShell>
        <OfflineSync />
      </body>
    </html>
  );
}
