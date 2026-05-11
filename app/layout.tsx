import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIRMAMENT — Compagnon stratégique des dirigeants | Duleme & Cie",
  description: "Tu me dis ce que tu as dans la tête. FIRMAMENT t'aide à savoir quoi faire. Clarifier, structurer, cadencer — avec Téfi, ton compagnon stratégique.",
  keywords: "stratégie dirigeant, clarté mentale, productivité, prise de décision, Martinique, Duleme",
  openGraph: {
    title: "FIRMAMENT — Ton compagnon stratégique",
    description: "Tu me dis ce que tu as dans la tête. FIRMAMENT t'aide à savoir quoi faire.",
    url: "https://frmmnt.fr",
    siteName: "FIRMAMENT",
    locale: "fr_FR",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FIRMAMENT",
    startupImage: "/apple-touch-icon.png",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#5C1A2E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
