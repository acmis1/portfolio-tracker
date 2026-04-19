import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getLiveExchangeRate } from "@/lib/fx";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aegis Ledger | Institutional Wealth Tracker",
  description: "Institutional-grade wealth management and portfolio intelligence",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fxRate = await getLiveExchangeRate();

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-slate-950">
          <TooltipProvider>
            <Navigation fxRate={fxRate} />
            <div className="flex-1">{children}</div>
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
