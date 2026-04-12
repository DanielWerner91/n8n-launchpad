import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "LaunchPad — Plan & Execute Product Launches",
  description:
    "AI-powered go-to-market strategy generator. Plan your product launch across every channel with a step-by-step playbook.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-launchpad.png",
  },
  openGraph: {
    title: "LaunchPad — Plan & Execute Product Launches",
    description:
      "AI-powered go-to-market strategy generator. Plan your product launch across every channel with a step-by-step playbook.",
    images: ["/logo-launchpad.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
