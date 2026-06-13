import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { montserrat } from "./ui/fonts";
import { CarbonBadge } from "./ui/carbon-badge";
import { ThemeToggle } from "./ui/theme-toggle";
import { TopbarMenu } from "./ui/topbar-menu";
import { AuthButtons } from "./ui/auth-buttons";
import { CollaborationButton } from "./ui/collaboration-button";
import { TooltipProvider } from "./ui/tooltip/tooltip-context";
import { TooltipOverlay } from "./ui/tooltip/tooltip-overlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenPrompt Guide",
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
            <Link href="/" className="brand brand-logo" aria-label="GreenPrompt Guide home">
              <Image
                src="/GreenPrompt-Guide_final_logo.png"
                alt="GreenPrompt Guide"
                width={440}
                height={378}
                className="logo-light"
                priority
              />
              <Image
                src="/GreenPrompt-Guide_final_logo_dark.png"
                alt="GreenPrompt Guide"
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
            <Link href="/glossary" className="animated-link">
              Glossary
            </Link>
            <CollaborationButton />
            <Link href="/#about-greenprompt-guide" className="animated-link">
              About
            </Link>
          </nav>
          <div className="topbar-cta topbar-cta-desktop">
            <ThemeToggle />
          </div>
          <AuthButtons />
          <TopbarMenu />
        </header>
        <main className="app-main" >
          <TooltipProvider>
            {children}
            <TooltipOverlay />
          </TooltipProvider>
        </main>
        <footer className="site-footer">
          <div className="site-footer-content">
            <div className="site-footer-info">
              <h2 className="site-footer-heading">GreenPrompt Guide</h2>
              <p className="site-footer-description">
                A catalog of Green Prompt Engineering practices.
              </p>
            </div>
            <div className="site-footer-logos" aria-label="Institutional logos">
              <div className="site-footer-brand-logos">
                <a href="https://www.fib.upc.edu/" target="_blank" rel="noopener noreferrer" aria-label="FIB - Barcelona School of Informatics">
                  <Image
                    src="/fib_logo.png"
                    alt="FIB - Barcelona School of Informatics"
                    width={80}
                    height={80}
                    className="footer-logo footer-logo-fib"
                  />
                </a>
                <a href="https://gessi.upc.edu/en" target="_blank" rel="noopener noreferrer" aria-label="GESSI - Software Engineering and AI-Based Systems Group ">
                  <Image
                    src="/gessi_logo.png"
                    alt="GESSI"
                    width={80}
                    height={80}
                    className="footer-logo footer-logo-gessi"
                  />
                </a>
              </div>
              <a href="https://www.upc.edu/" target="_blank" rel="noopener noreferrer" aria-label="UPC - Universitat Politècnica de Catalunya" className="footer-logo-upc-link">
                <Image
                  src="/upc_logo-light.svg"
                  alt="UPC - Universitat Politècnica de Catalunya"
                  width={80}
                  height={80}
                  className="footer-logo footer-logo-light footer-logo-upc"
                />
                <Image
                  src="/upc_logo-dark.svg"
                  alt="UPC - Universitat Politècnica de Catalunya"
                  width={80}
                  height={80}
                  className="footer-logo footer-logo-dark footer-logo-upc"
                />
              </a>
            </div>
            <CarbonBadge initialTheme={initialTheme} url="nattech.fib.upc.edu:40470" />
          </div>
        </footer>
      </body>
    </html>
  );
}
