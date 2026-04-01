import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TenantProvider } from "@/providers/tenant-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OWD CRM - Multi-Tenant Dashboard",
  description: "Glass quote and invoice management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
