import V2Hero from "@/components/v2/home/V2Hero";
import V2About from "@/components/v2/home/V2About";
import V2Categories from "@/components/v2/home/V2Categories";
import V2Products from "@/components/v2/home/V2Products";
import V2Promo from "@/components/v2/home/V2Promo";
import V2Perks from "@/components/v2/home/V2Perks";
import V2Newsletter from "@/components/v2/home/V2Newsletter";
import { getV2Locale } from "@/lib/v2/i18n";

export default async function V2HomePage() {
  const { v2, lang } = await getV2Locale();
  return (
    <>
      <V2Hero v2={v2} />
      <V2About v2={v2} />
      <V2Categories v2={v2} lang={lang} />
      <V2Products v2={v2} lang={lang} />
      <V2Promo v2={v2} />
      <V2Perks perks={v2.perks} />
      <V2Newsletter copy={v2.news} />
    </>
  );
}
