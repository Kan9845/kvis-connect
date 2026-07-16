import type { Metadata } from "next";
import { Inter, Be_Vietnam_Pro, Bricolage_Grotesque, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavbarVariantProvider } from "@/contexts/NavbarVariantContext";
import { Providers, RQProviders } from "./providers";
import { Navbar } from "@/components/layout/NavbarWrapper";
import { Toaster } from "@/components/layout/Toaster";
import { SiteThemeLoader } from "@/components/SiteThemeLoader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
});
const notoThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-thai",
});

export const metadata: Metadata = {
  title: "KVIS Connect",
  description: "KVIS Alumni Network",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="" />
        <link rel="preconnect" href="https://flagcdn.com" crossOrigin="" />
        <link
          rel="preload"
          as="image"
          href="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          crossOrigin=""
        />
      </head>
      <body className={`${inter.variable} ${beVietnamPro.variable} ${bricolage.variable} ${notoThai.variable}`}>
        <Providers>
          <SiteThemeLoader />
          <AuthProvider>
            <RQProviders>
              <NavbarVariantProvider>
                <div className="h-dvh flex flex-col overflow-hidden">
                  <Navbar />
                  <main className="min-h-0 flex-1 relative overflow-y-auto">{children}</main>
                </div>
                <Toaster />
              </NavbarVariantProvider>
            </RQProviders>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
