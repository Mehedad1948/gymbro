import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/shared/ui/bottom-nav";
import { RegisterServiceWorker } from "@/infra/pwa/register-sw";
import { AppBootstrap } from "@/features/bootstrap/app-bootstrap";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Gymbro", template: "%s · Gymbro" },
  description: "Training plans, set logs and movement guides. Offline, on your phone.",
  applicationName: "Gymbro",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Gymbro" },
  formatDetection: { telephone: false },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppBootstrap />
        <RegisterServiceWorker />
        <main
          className="mx-auto w-full max-w-lg px-4 pt-4"
          style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
