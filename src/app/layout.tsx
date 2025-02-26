import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { CurrencyProvider } from "@/lib/context/CurrencyContext";
import { ToastInitializer } from "@/components/ui/toast-initializer";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-N5SFJ07P99';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Smart Zakat Calculator",
  description: "Calculate your Zakat accurately with real-time asset values",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} antialiased`}>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <ToastInitializer />
      </body>
    </html>
  );
}
