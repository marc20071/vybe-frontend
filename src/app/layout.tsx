import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export const metadata: Metadata = {
  title: { default: "VYBE — Find your people", template: "%s · VYBE" },
  description: "A place for the moments, people, and ideas that move you.",
  applicationName: "VYBE",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/vybe-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/vybe-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VYBE",
  },
};
export const viewport: Viewport = { themeColor: "#101014", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PwaRegister /><AuthProvider><Navbar /><div className="app-shell"><Sidebar /><main className="main-content">{children}</main></div><MobileNavigation /></AuthProvider></body></html>;
}
