import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Helicopter Landing Game",
  description: "Fly a helicopter and land on tall buildings in a cartoon world!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}