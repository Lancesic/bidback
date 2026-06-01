import type { Metadata, Viewport } from "next";
import { BidBackPolish } from "@/components/bidback-polish";
import { SignupSettingsBridge } from "@/components/signup-settings-bridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidBack",
  description: "Stop losing jobs after the estimate.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BidBack",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f6b4f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BidBackPolish />
        <SignupSettingsBridge />
        {children}
      </body>
    </html>
  );
}
