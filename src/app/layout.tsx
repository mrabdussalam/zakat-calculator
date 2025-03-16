import { inter, syne, anglecia, nbInternational } from "@/lib/fonts";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { CurrencyProvider } from "@/lib/context/CurrencyContext";
import { ToastInitializer } from "@/components/ui/toast-initializer";
import { ClientHydration } from "@/components/ui/ClientHydration";
import { ClientDebugger } from "@/components/ui/ClientDebugger";
import { HydrationGuard } from '@/components/ui/HydrationGuard'
import { HydrationStatus } from '@/components/ui/HydrationStatus'
import { HydrationTester } from '@/components/ui/HydrationTester'
import { PageTransition } from '@/components/ui/PageTransition'
import { cn } from "@/lib/utils";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-N5SFJ07P99';
const isDevelopment =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

// Log fonts for debugging
console.log('Font variables:', {
  inter: inter.variable,
  syne: syne.variable,
  anglecia: anglecia.variable,
  nbInternational: nbInternational.variable
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
      <body className={`${inter.variable} ${syne.variable} ${anglecia.variable} ${nbInternational.variable} antialiased`}>
        <ClientHydration />
        <HydrationGuard fallback={
          <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-medium">Loading...</h2>
              <p className="text-muted-foreground">Please wait while we restore your calculations</p>
            </div>
          </div>
        }>
          <CurrencyProvider>
            <PageTransition>
              {children}
            </PageTransition>
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
