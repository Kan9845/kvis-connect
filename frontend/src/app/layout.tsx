import type { Metadata } from "next";
import { Inter, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavbarVariantProvider } from "@/contexts/NavbarVariantContext";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/layout/Toaster";

const inter = Inter({ subsets: ["latin"] });
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
  title: "KVIS Connect",
  description: "KVIS Alumni Network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
      <body className={`${inter.className} ${beVietnamPro.variable}`}>
        <Providers>
          <NavbarVariantProvider>
          <AuthProvider>
            <div className="h-screen flex flex-col overflow-hidden">
              <Navbar />
              <main className="flex-1 relative overflow-y-auto">{children}</main>
            </div>
            <Toaster />
          </AuthProvider>
          </NavbarVariantProvider>
        </Providers>
      </body>
    </html>
  );
}
