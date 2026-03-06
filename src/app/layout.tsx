import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OWD Glass - Professional Glazing Services",
  description: "Get instant quotes for glass repairs, shower doors, and aluminum installations. Professional glazing services in South Africa.",
  keywords: "glass repair, shower door, aluminum windows, glazing, South Africa, SANS certified",
  openGraph: {
    title: "OWD Glass - Professional Glazing Services",
    description: "Get instant quotes for glass repairs, shower doors, and aluminum installations. Professional glazing services in South Africa.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
