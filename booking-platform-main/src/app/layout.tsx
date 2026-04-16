import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "../components/SidebarWrapper"; 
import AppProviders from "../components/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Demo Booking Platform",
  description: "Enterprise-grade demo management and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${inter.className} flex bg-slate-50 h-screen overflow-hidden text-slate-900 antialiased`}>
        <AppProviders>
          <SidebarWrapper />

          <main className="flex-1 h-screen overflow-y-auto w-full relative">
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </AppProviders>
      </body>
    </html>
  );
}