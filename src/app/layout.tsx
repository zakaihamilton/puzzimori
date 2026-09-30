import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Puzzimori · Little puzzles. Big discoveries.",
  description:
    "Follow the clues and discover the secret number behind every emoji. A playful math adventure in English and Hebrew.",
  applicationName: "Puzzimori",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
