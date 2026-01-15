import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CurveWatch | Plateforme Analyse Courbes Taux | US & Canada",
  description:
    "CurveWatch - Plateforme professionnelle d'analyse des courbes de rendement obligataires avec donnees en temps reel du Tresor americain et Banque du Canada. Visualisation interactive, metriques avancees, spreads et PCA.",
  keywords: [
    "yield curve",
    "courbe de taux",
    "bonds",
    "treasury",
    "fixed income",
    "obligations",
    "tresor americain",
    "banque du canada",
    "financial analysis",
    "analysis financiere",
  ],
  generator: "v0.app",
  creator: "JSLAI",
  authors: [{ name: "JSLAI" }],
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    alternateLocale: ["en_US"],
    title: "CurveWatch - Analyse Courbes Taux Obligataires",
    description: "Plateforme d'analyse des courbes de rendement avec donnees temps reel",
    siteName: "CurveWatch",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  interactiveWidget: "resizes-content",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" role="document">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CurveWatch" />
        <meta name="application-name" content="CurveWatch" />
      </head>
      <body
        className={`font-sans antialiased`}
        role="application"
        aria-label="CurveWatch - Plateforme d'analyse des courbes de rendement obligataires"
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
