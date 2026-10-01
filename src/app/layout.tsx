import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#fbf8f0",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Puzzimori · Little puzzles. Big discoveries.",
  description:
    "Follow the clues and discover the secret number behind every emoji. A playful math adventure in English and Hebrew.",
  applicationName: "Puzzimori",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Puzzimori",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
