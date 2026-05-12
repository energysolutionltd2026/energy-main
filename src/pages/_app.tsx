import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import { NavBar, ButtomNavbar } from "@/components";
import { DepotProvider } from "@/context/DepotContext";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    }
  }, []);
  const { pathname } = useRouter();

  // Routes where the general layout should be hidden
  const hideLayout =
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/merchant") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/bulk-dealer") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/station-manager") ||
    pathname === "/" ||
    pathname === "/landing" ||
    pathname === "/landingPage";

  return (
    <DepotProvider>
      <Head>
        <meta name="application-name" content="e-Nergy" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="e-Nergy" />
        <meta name="theme-color" content="#f97316" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/eNnergy Logo.png" />
      </Head>
      <div className="flex flex-col min-h-screen">
        {!hideLayout && <NavBar />}

        <main className="flex-grow">
          <Component {...pageProps} />
        </main>

        {!hideLayout && <ButtomNavbar />}
      </div>
    </DepotProvider>
  );

}
