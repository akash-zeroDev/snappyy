import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Patrick_Hand, Caveat, Permanent_Marker, Indie_Flower, Shadows_Into_Light, Satisfy } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-patrick-hand",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  variable: "--font-permanent-marker",
  subsets: ["latin"],
});

const indieFlower = Indie_Flower({
  weight: "400",
  variable: "--font-indie-flower",
  subsets: ["latin"],
});

const shadowsIntoLight = Shadows_Into_Light({
  weight: "400",
  variable: "--font-shadows",
  subsets: ["latin"],
});

const satisfy = Satisfy({
  weight: "400",
  variable: "--font-satisfy",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | MemoryPrint',
    default: 'MemoryPrint - The Virtual Photo Booth',
  },
  description: 'An immersive, interactive virtual photo booth and digital memory board. Capture, customize, and save digital polaroids directly in your browser.',
  keywords: ['virtual photo booth', 'digital polaroids', 'online scrapbooking', 'polaroid frame', 'photo strips'],
  openGraph: {
    title: 'MemoryPrint',
    description: 'Bring the nostalgic charm of Polaroid cameras to your browser.',
    url: 'https://memoryprint.app', // Using .app or whatever they host on
    siteName: 'MemoryPrint',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MemoryPrint Virtual Photo Booth',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MemoryPrint',
    description: 'Capture, customize, and save digital polaroids directly in your browser.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${patrickHand.variable} ${caveat.variable} ${permanentMarker.variable} ${indieFlower.variable} ${shadowsIntoLight.variable} ${satisfy.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX"} />
    </html>
  );
}
