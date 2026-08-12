import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CancerAtlas · Ask about cancer. Understand the evidence.",
  description:
    "Every answer traces back to a real medical document. Nothing invented, nothing generalized beyond what the sources actually say.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('cancer-atlas-theme')||localStorage.getItem('ca-theme');var dark=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches||!t;if(dark)document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.variable} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
