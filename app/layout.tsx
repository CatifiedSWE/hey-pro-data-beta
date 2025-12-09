import type { Metadata } from "next";
import { Poppins, Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Providers from "@/components/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "HeyProData",
  description: "A Creative Industry Marketplace Platform",
  keywords:
    "HeyProData, creative marketplace, film industry jobs, media professionals, hire creatives, production gigs, freelance filmmakers, creative collaboration, entertainment industry network, project hiring platform",
  robots: { index: true, follow: true },
  authors: [{ name: "HeyProData", url: "https://heyprodata.com" }],
  creator: "HeyProData",
  publisher: "HeyProData",
  icons: {
    icon: [
      "/favicon.ico",
      "/logo.png",
      "/apple-icon.png",
      "icon0.svg",
      "icon1.png",
      "/logo/favicon.svg",
      "/logo/web-app-manifest-192x192.png",
      "/logo/web-app-manifest-461x161.png",
      "/logo/web-app-manifest-512x512.png",
    ],
  },
  metadataBase: new URL("https://heyprodata.com"),
  openGraph: {
    title: "HeyProData",
    description: "A Creative Industry Marketplace Platform",
    type: "website",
    emails: "support@heyprodata.com",
    countryName: "UAE",
    url: "https://heyprodata.com",
    siteName: "HeyProData",
    images: ["/favicon.ico", "logo.png"],
    locale: "en-UAE",
  },
};

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const getAnalyticsId = process.env.GOOGLE_ANALYTICS_ID;

  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="HeyProData" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />

        {/* Google tag (gtag.js) */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${getAnalyticsId}`}
        />
        <Script id="google-analytics">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${getAnalyticsId}');
          `}
        </Script>
      </head>

      <body className={`${poppins.variable} ${outfit.variable} font-poppins bg-white text-black`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
export default RootLayout;