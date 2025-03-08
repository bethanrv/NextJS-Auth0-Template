import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Dosis } from 'next/font/google';
import { Protest_Guerrilla } from 'next/font/google';


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const dosis = Dosis({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-primary'
});

const protestGuerrilla = Protest_Guerrilla({
  weight: '400', // This font only has 1 weight
  subsets: ['latin'],
  variable: '--font-card-header',
  display: 'swap',
  adjustFontFallback: 'Protest Guerrilla' 
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <UserProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${dosis.variable} ${protestGuerrilla.variable} antialiased`}
        >
          {children}
        </body>
      </UserProvider>
    </html>
  );
}
