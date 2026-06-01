import type { Metadata, Viewport } from "next";
import { BidBackPolish } from "@/components/bidback-polish";
import { ControlRoomPolish } from "@/components/control-room-polish";
import { DashboardOpenEstimates } from "@/components/dashboard-open-estimates";
import { DashboardSpacingPolish } from "@/components/dashboard-spacing-polish";
import { SettingsPolish } from "@/components/settings-polish";
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
        <ControlRoomPolish />
        <DashboardOpenEstimates />
        <DashboardSpacingPolish />
        <SettingsPolish />
        {children}
      </body>
    </html>
  );
}
