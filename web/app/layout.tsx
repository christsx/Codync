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

export const metadata: Metadata = {
  title: "Sidekicks — Your work companions",
  description:
    "Your sidekicks, ready to build with you. Turn your favorite coding agents into a crew of familiar faces. Native on Mac and iPhone.",
  metadataBase: new URL("https://usesidekicks.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sidekicks — Your work companions",
    description: "A little crew. A lot done.",
    url: "https://usesidekicks.com",
    siteName: "Sidekicks",
  },
  icons: { icon: "/sidekicks/logo.webp", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-200">
        {children}
      </body>
    </html>
  );
}
