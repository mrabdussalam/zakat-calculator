import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { CurrencyProvider } from "@/lib/context/CurrencyContext";
import { ToastInitializer } from "@/components/ui/toast-initializer";
import { ClientHydration } from "@/components/ui/ClientHydration";
import { ClientDebugger } from "@/components/ui/ClientDebugger";
import localFont from "next/font/local";
import { HydrationGuard } from '@/components/ui/HydrationGuard'
import { HydrationStatus } from '@/components/ui/HydrationStatus'
import { HydrationTester } from '@/components/ui/HydrationTester'
import { cn } from "@/lib/utils";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-N5SFJ07P99';
const isDevelopment =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Add Aeonik local font
const aeonik = localFont({
  src: [
    {
      path: '../fonts/Aeonik/woff2/Aeonik-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Aeonik/woff2/Aeonik-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Aeonik/woff2/Aeonik-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-aeonik',
  preload: true,
});

// Log fonts for debugging
console.log('Font variables:', {
  inter: inter.variable,
  aeonik: aeonik.variable
});

export const metadata: Metadata = {
  title: "Zakat Guide | Calculate your Zakat",
  description: "Calculate your Zakat with confidence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${aeonik.variable} antialiased`}>
        <ClientHydration />
        <HydrationGuard fallback={
          <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-medium">Loading your data...</h2>
              <p className="text-muted-foreground">Please wait while we restore your calculations</p>
            </div>
          </div>
        }>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </HydrationGuard>

        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <ToastInitializer />

        {/* State Debugger (only in development) */}
        {isDevelopment && (
          <>
            <ClientDebugger />
            <HydrationStatus />
            <HydrationTester />
          </>
        )}
      </body>
    </html>
  );
}
