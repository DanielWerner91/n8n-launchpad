import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { PostHogProvider } from "@/components/posthog-provider";
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
  title: {
    default: "LaunchPad - Plan & Execute Product Launches",
    template: "%s | LaunchPad",
  },
  description:
    "AI-powered go-to-market strategy generator. Plan your product launch across every channel with a step-by-step playbook.",
  metadataBase: new URL("https://launchpad-six-tau.vercel.app"),
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-launchpad.png",
  },
  openGraph: {
    type: "website",
    siteName: "LaunchPad",
    title: "LaunchPad - Plan & Execute Product Launches",
    description:
      "AI-powered go-to-market strategy generator. Plan your product launch across every channel with a step-by-step playbook.",
    images: ["/logo-launchpad.png"],
  },
  twitter: {
    card: "summary",
    title: "LaunchPad - Plan & Execute Product Launches",
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
        <PostHogProvider>
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
