import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DS Gems | Natural Certified Gemstones from Sri Lanka",
  description:
    "Buy certified natural gemstones from Sri Lanka. Blue Sapphires, Rubies, Emeralds, Alexandrite and more. Worldwide shipping. Trusted dealer with 15+ years experience.",
  keywords:
    "Ceylon sapphire, blue sapphire Sri Lanka, natural gemstones, buy gemstones online, certified gems, ruby, emerald, padparadscha, alexandrite, DS Gems",
  authors: [{ name: "DS Gems" }],
  metadataBase: new URL("https://www.dsgemslk.com"),
  alternates: { canonical: "https://www.dsgemslk.com" },
  openGraph: {
    type: "website",
    title: "DS Gems | Natural Certified Gemstones from Sri Lanka",
    description:
      "Certified natural gemstones sourced ethically from Sri Lanka. Blue Sapphires, Rubies, Emeralds and rare collector gems. Worldwide shipping.",
    url: "https://www.dsgemslk.com",
    siteName: "DS Gems",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DS Gems | Natural Certified Gemstones from Sri Lanka",
    description: "Certified natural gemstones sourced ethically from Sri Lanka.",
    images: ["/og-image.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "DS Gems",
  description:
    "Natural certified gemstone dealer based in Sri Lanka. Specialising in Blue Sapphires, Rubies, Emeralds and rare collector gems.",
  url: "https://www.dsgemslk.com",
  telephone: "+94715557038",
  email: "dsgemslk@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Colombo",
    addressCountry: "LK",
  },
  sameAs: ["https://www.instagram.com/dsgems.lk/"],
  openingHours: "Mo-Sa 09:00-18:00",
  currenciesAccepted: "USD",
  priceRange: "$$$$",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#06402b" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}