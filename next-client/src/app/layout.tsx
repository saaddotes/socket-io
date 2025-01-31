import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/authContext";
// import { Toaster as ShadToaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Quick Chat",
  description: "A modern chat application built with Next.js and Socket IO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <AuthProvider>
        <body className={inter.className}>
          <div>
            <Toaster />
          </div>
          {children}
          {/* <ShadToaster /> */}
        </body>
      </AuthProvider>
    </html>
  );
}
