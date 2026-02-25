import { inter, syne, anglecia } from "@/lib/fonts";
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
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { defaultLocale, isValidLocale, type Locale } from "@/i18n/config";
import { cookies } from "next/headers";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const isDevelopment =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

export const metadata: Metadata = {
  title: "Zakat Guide | Calculate your Zakat",
  description: "Calculate your Zakat with confidence",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('zakat-locale')?.value;
  const locale: Locale =
    cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} ${syne.variable} ${anglecia.variable} antialiased`}>
        {GA_ID && (
          <>
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
          </>
        )}
        <LocaleProvider initialLocale={locale} initialMessages={messages}>
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

          {isDevelopment && (
            <>
              <ClientDebugger />
              <HydrationStatus />
              <HydrationTester />
            </>
          )}
        </LocaleProvider>
      </body>
    </html>
  );
}
