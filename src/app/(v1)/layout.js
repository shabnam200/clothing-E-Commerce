import TopBar from "@/components/layout/TopBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { getLocale } from "@/lib/i18n";

// Version 1 chrome. Moved here (unchanged) from the root layout so /v2 can have its own header/footer.
// A route group adds no URL segment: "/" is still Version 1.
export default async function V1Layout({ children }) {
  const { t, lang } = await getLocale();
  return (
    <>
      <TopBar t={t} lang={lang} />
      <Header t={t} lang={lang} />
      <main className="flex-1">{children}</main>
      <Footer t={t} lang={lang} />
      <ThemeToggle lightLabel={t.ui.light} darkLabel={t.ui.dark} />
    </>
  );
}
