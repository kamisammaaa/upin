import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UPIN-SMKBA",
  description: "Sistem Ujian Berbasis Komputer (CBT) SMK Banjar Asri. Ujian online yang aman, mudah, dan terpercaya.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UPIN",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-180x180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#7000FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Cegah zoom saat ujian
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'dark';

  return (
    <html
      lang="id"
      data-theme={theme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-Flicker Theme Initializer */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const localTheme = localStorage.getItem('theme');
                if (localTheme === 'light' || localTheme === 'dark') {
                  document.documentElement.setAttribute('data-theme', localTheme);
                }
              } catch (e) {}
            `,
          }}
        />
        {/* PWA Meta Tags */}
        <meta name="application-name" content="UPIN" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="UPIN" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* iOS Splash / Icon */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Register Service Worker */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('SW registered:', reg.scope); })
                    .catch(function(err) { console.log('SW error:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
