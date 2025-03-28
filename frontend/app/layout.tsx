/**
 * @file layout.tsx
 * @description The root layout component that provides global styles, fonts, theme, and common components like Navbar, Footer, Chat, and NotificationSnackbar.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./ThemeProvider";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/footer/Footer";
import Chat from "../components/chat/Chat";
import Providers from "./providers";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import NotificationSnackbar from "@/components/NotificationSnackbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vamoose.it.com"),
  title: "Vamoose! – Plan Group Trips Smarter",
  description:
    "Vamoose! is an all-in-one app for planning group trips, tracking shared expenses, building itineraries, and collaborating in real-time.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Vamoose! – Group Trip & Expense Planner",
    description:
      "Plan, split, and explore together. Vamoose! brings your travel crew onto one platform.",
    siteName: "Vamoose!",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: "Vamoose! App Preview",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}
      >
        <MantineProvider>
          <ThemeProvider>
            <Navbar />
            <Providers>
              <main>{children}</main>
              <Footer />
              <NotificationSnackbar />
              <Chat />
            </Providers>
          </ThemeProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
