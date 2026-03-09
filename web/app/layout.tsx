import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google Reviews Scraper",
  description: "Scrape Google Reviews for website mockups",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
