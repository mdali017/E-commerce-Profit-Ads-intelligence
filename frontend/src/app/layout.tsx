import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProfitPulse — E-commerce Profit & Ads Intelligence",
  description: "Single Source of Truth for E-commerce Ads, Orders, Courier Tracking & Net Profit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
