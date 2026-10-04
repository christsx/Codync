import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sidekicks — A little crew. A lot done.",
  description:
    "Your sidekicks, ready to build with you. Turn your favorite coding agents into a crew of familiar faces. Native on Mac and iPhone.",
  metadataBase: new URL("https://usesidekicks.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sidekicks — A little crew. A lot done.",
    description: "A little crew. A lot done.",
    url: "https://usesidekicks.com",
    siteName: "Sidekicks",
    type: "website",
    images: [{ url: "/sidekicks/share-preview.png", width: 1200, height: 630, alt: "Sidekicks — A little crew. A lot done." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sidekicks — A little crew. A lot done.",
    description: "A little crew. A lot done.",
    images: ["/sidekicks/share-preview.png"],
  },
  icons: { icon: "/sidekicks/pink-furry-icon.png", apple: "/sidekicks/pink-furry-apple.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col text-neutral-200">
        {children}
      </body>
    </html>
  );
}
