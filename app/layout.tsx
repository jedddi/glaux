import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/lib/query-provider";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Glaux — AI Model Analysis",
  description: "Inspect CNN models. Test them on data. Understand failures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased dark",
        geist.variable,
        geistMono.variable,
        "font-sans"
      )}
    >
      <body className="font-body text-on-background min-h-full flex flex-col bg-canvas">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
