import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaRegister } from "@/components/PwaRegister";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Les Orchidées 2 — Gestion",
  description: "Application de gestion de la résidence Les Orchidées 2",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Orchidées 2" },
};

export const viewport: Viewport = {
  themeColor: "#166534",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
