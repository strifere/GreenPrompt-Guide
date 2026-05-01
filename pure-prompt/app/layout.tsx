import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { montserrat } from "./ui/fonts";
import { CarbonBadge } from "./ui/carbon-badge";
import { ThemeToggle } from "./ui/theme-toggle";
import { TopbarMenu } from "./ui/topbar-menu";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pure Prompt",
  description: "A catalog ofGreen Prompt Engineering practices",
};

const themeBootScript = `
  (function () {
    try {
      var preference = null;
      var cookieMatch = document.cookie.match(/(?:^|; )theme-preference=([^;]+)/);

      if (cookieMatch) {
        preference = decodeURIComponent(cookieMatch[1]);
      }

      if (!preference) {
        preference = window.localStorage.getItem('theme-preference');
      }

      if (preference !== 'light' && preference !== 'dark' && preference !== 'system') {
        preference = 'system';
      }

      var resolved = preference === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : preference;

      document.documentElement.style.colorScheme = resolved;

      if (preference === 'system') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', preference);
      }
    } catch (error) {
      // Ignore bootstrapping errors and let CSS fall back to the system preference.
    }
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themePreferenceCookie = (await cookies()).get("theme-preference")?.value;
  const initialTheme =
    themePreferenceCookie === "light" || themePreferenceCookie === "dark"
      ? themePreferenceCookie
      : undefined;

  return (
    <html
      lang="en"
      className={`${montserrat.className} h-full antialiased`}
      data-theme={initialTheme}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="topbar">
          <div >
            <Link href="/" className="brand brand-logo" aria-label="PurePrompt home">
              <Image
                src="/PurePrompt_final_logo.png"
                alt="PurePrompt"
                width={440}
                height={378}
                className="logo-light"
                priority
              />
              <Image
                src="/PurePrompt_final_logo_dark.png"
                alt="PurePrompt"
                width={440}
                height={378}
                className="logo-dark"
                priority
              />
            </Link>
          </div>
          <nav className="topnav-links topnav-links-desktop" aria-label="Primary">
            <Link href="/catalog" className="animated-link">
              Catalog
            </Link>
            <Link href="/collaboration" className="animated-link">
              Collaboration
            </Link>
            <Link href="/" className="animated-link">
              About
            </Link>
          </nav>
          <div className="topbar-cta topbar-cta-desktop">
            <ThemeToggle />
            <Link href="/login" className="ghost-btn">
              Log in
            </Link>
            <Link href="/signup" className="solid-btn">
              Sign up
            </Link>
          </div>
          <TopbarMenu />
        </header>
        <main className="app-main" >
          {children}
        </main>
        <footer className="site-footer">
          <div className="site-footer-content">
            <div className="site-footer-copygroup">
              <p className="site-footer-label">Sustainable browsing</p>
              <p className="site-footer-copy">PurePrompt is tracked with the Website Carbon Badge.</p>
            </div>
            <CarbonBadge initialTheme={initialTheme} url="nattech.fib.upc.edu:40470" />
          </div>
        </footer>
      </body>
    </html>
  );
}
