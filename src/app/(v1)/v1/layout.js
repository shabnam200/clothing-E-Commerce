import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { getLocale } from "@/lib/i18n";
import { SITE } from "@/config/site";
import "./globals.css";

// Font file from the Dokani zip — has both Bangla and Latin glyphs.
const ador = localFont({ src: "../fonts/Ador-Noirrit-Regular.ttf", variable: "--font-ador", weight: "400", display: "swap" });

export async function generateMetadata() {
  const { t } = await getLocale();
  return { metadataBase: new URL(SITE.url), title: t.meta.title, description: t.meta.description };
}

// Root layout now only holds <html>/<body>, font and theme. Header/footer live in (v1) and (v2) layouts.
export default async function RootLayout({ children }) {
  const { lang } = await getLocale();
  return (
    <html lang={lang} suppressHydrationWarning className={ador.variable}>
      <body className="flex min-h-screen flex-col bg-page text-ink">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
