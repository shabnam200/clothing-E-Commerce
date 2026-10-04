import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import TopBar from "@/components/layout/TopBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ChatWhatsApp from "@/components/ui/ChatWhatsApp";
import { getLocale } from "@/lib/i18n";
import { SITE } from "@/config/site";
import "./globals.css";

// Font file from the Dokani zip — has both Bangla and Latin glyphs.
const ador = localFont({ src: "../fonts/Ador-Noirrit-Regular.ttf", variable: "--font-ador", weight: "400", display: "swap" });

export async function generateMetadata() {
  const { t } = await getLocale();
  return { metadataBase: new URL(SITE.url), title: t.meta.title, description: t.meta.description };
}

export default async function RootLayout({ children }) {
  const { t, lang } = await getLocale();
  return (
    <html lang={lang} suppressHydrationWarning className={ador.variable}>
      <body className="flex min-h-screen flex-col bg-page text-ink">
        {/* Light by default, like the zip */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TopBar t={t} lang={lang} />
          <Header t={t} lang={lang} />
          <main className="flex-1">{children}</main>
          <Footer t={t} lang={lang} />
          <ThemeToggle lightLabel={t.ui.light} darkLabel={t.ui.dark} />
          <ChatWhatsApp />
        </ThemeProvider>
      </body>
    </html>
  );
}