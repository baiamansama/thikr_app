import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Thikr — Islamic Learning Platform",
    template: "%s | Thikr",
  },
  description:
    "Learn azkar, duas, and Quran through structured minicourses. Track your progress, earn badges, and grow your knowledge.",
  openGraph: {
    title: "Thikr — Islamic Learning Platform",
    description:
      "Learn azkar, duas, and Quran through structured minicourses. Track your progress, earn badges, and grow your knowledge.",
    url: "https://azkar.link",
    siteName: "Thikr",
    images: [
      {
        url: "https://azkar.link/preview/all_in_one.png",
        width: 1200,
        height: 630,
        alt: "Thikr — Islamic Learning Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  metadataBase: new URL("https://azkar.link"),
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#5a7247" />
        <link rel="apple-touch-icon" href="/icons/logo_192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-cream-50`}
      >
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
