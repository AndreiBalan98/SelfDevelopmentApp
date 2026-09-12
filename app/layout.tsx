import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Life Tracker",
  description: "Personal tracking for nutrition, weight, sleep and smoking.",
  // Makes it launch from the home screen without Safari's address bar and
  // tab bar, and sets the label shown under the icon.
  appleWebApp: {
    capable: true,
    title: "Life",
    statusBarStyle: "black",
  },
  // Next.js only emits the modern, unprefixed version of the tag above.
  // Older iOS versions read the Apple-prefixed one, so it goes in by hand.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1c1f",
  // Lets the tab bar's background run down behind the iPhone's home indicator,
  // with its icons kept clear of it (the tab bar pads itself by the safe area).
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
