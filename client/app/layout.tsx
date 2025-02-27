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
    case "ru":
      return "/preview/russian.jpeg";
    case "ky":
      return "/preview/kyrgyz.jpeg";
    case "ar":
      return "/preview/arabic.jpeg";
    case "en":
    default:
      return "/preview/english.jpeg";
  }
};

export const generateMetadata = ({ params }: { params?: { lang?: string } }): Metadata => {
  const lang = params?.lang || "en";
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
      locale: lang === "ru" ? "ru_RU" : lang === "ky" ? "ky_KG" : lang === "ar" ? "ar_AR" : "en_US",
      type: "website",
    },
  };
};

export default function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params?: { lang?: string } }>) {
  const lang = params?.lang || "en";

  return (
    <html lang={lang}>
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