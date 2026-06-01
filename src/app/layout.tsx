import type { Metadata, Viewport } from "next";
import { ActiveEstimateFeedbackPrompt } from "@/components/active-estimate-feedback-prompt";
import { BidBackPolish } from "@/components/bidback-polish";
import { ControlRoomPolish } from "@/components/control-room-polish";
import { DashboardOpenEstimates } from "@/components/dashboard-open-estimates";
import { DashboardSpacingPolish } from "@/components/dashboard-spacing-polish";
import { DemoDataControls } from "@/components/demo-data-controls";
import { FollowUpStageTrail } from "@/components/follow-up-stage-trail";
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
        <DemoDataControls />
        <FollowUpStageTrail />
        <SettingsPolish />
        <ActiveEstimateFeedbackPrompt />
        {children}
      </body>
    </html>
  );
}
