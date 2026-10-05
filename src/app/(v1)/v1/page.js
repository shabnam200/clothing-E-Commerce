import { getLocale } from "@/lib/i18n";
import Hero from "@/components/sections/Hero";
import Categories from "@/components/sections/Categories";
import NewArrivals from "@/components/sections/NewArrivals";

export default async function HomePage() {
  const { t, lang } = await getLocale();
  return (
    <>
      <Hero t={t} />
      <Categories t={t} lang={lang} />
      <NewArrivals t={t} lang={lang} />
    </>
  );
}
