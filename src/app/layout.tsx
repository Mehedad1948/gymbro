import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/shared/ui/bottom-nav";
import { RegisterServiceWorker } from "@/infra/pwa/register-sw";
import { AppBootstrap } from "@/features/bootstrap/app-bootstrap";
import { NOINDEX, SITE_NAME, SITE_TAGLINE_FA, siteUrl } from "./site";

const vazirmatn = Vazirmatn({ variable: "--font-vazirmatn", subsets: ["arabic", "latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE_FA,
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: SITE_NAME },
  formatDetection: { telephone: false },
  icons: { apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_TAGLINE_FA,
    url: "/",
    locale: "fa_IR",
    // image comes from src/app/opengraph-image.tsx (file convention)
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE_FA,
  },
  // Pre-release: block indexing until NEXT_PUBLIC_ALLOW_INDEXING=true (see src/app/site.ts, robots.ts).
  robots: NOINDEX
    ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } }
    : { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${geistMono.variable} h-full antialiased`}>
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
