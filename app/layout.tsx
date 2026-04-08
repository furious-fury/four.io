import type { Metadata } from "next";
import { DM_Sans, Fredoka } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "four.io",
  description: "Connect 4 vs CPU with a verified global leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fredoka.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
