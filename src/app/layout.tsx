import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lithium Battery Risk Mesh",
  description: "Explore the risk of lithium batteries in aviation",
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
