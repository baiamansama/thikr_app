import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const getPreviewImage = (lang: string) => {
  switch (lang) {
    case "русский":
      return "/preview/russian.jpeg";
    case "кыргыз":
      return "/preview/kyrgyz.jpeg";
    case "عربي":
      return "/preview/arabic.jpeg";
    case "english":
    default:
      return "/preview/english.jpeg";
  }
};

export const generateMetadata = ({ searchParams }: { searchParams?: { lang?: string } }): Metadata => {
  const lang = searchParams?.lang || "english";
  return {
    title: "Thikr App 📿",
    description: "A simple Thikr app",
    openGraph: {
      title: "Thikr App 📿",
      description: "A simple Thikr app",
      images: [
        {
          url: getPreviewImage(lang),
          width: 1200,
          height: 630,
          alt: "Thikr App Preview",
        },
      ],
      locale: lang === "русский" ? "ru_RU" : lang === "кыргыз" ? "ky_KG" : lang === "عربي" ? "ar_AR" : "en_US",
      type: "website",
    },
  };
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}