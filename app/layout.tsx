import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Accreditor - Coaching Log & CPD Tracker",
  description: "Professional coaching log and CPD tracking application for ICF accredited coaches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geistSans.className}>
        <nav className="p-4 bg-gray-100 flex gap-4">
          <a href="/login" className="text-blue-600 hover:underline">Login</a>
          <a href="/register" className="text-blue-600 hover:underline">Register</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
