import V2Hero from "@/components/v2/home/V2Hero";
import V2Categories from "@/components/v2/home/V2Categories";
import V2About from "@/components/v2/home/V2About"; 
import V2Products from "@/components/v2/home/V2Products";
import V2Promo from "@/components/v2/home/V2Promo";
import V2Perks from "@/components/v2/home/V2Perks";
import { getV2Locale } from "@/lib/v2/i18n";

export default async function V2HomePage() {
  const { v2, lang } = await getV2Locale();
  return (
    <>
      <V2Hero v2={v2} />
      
      {/* 1. Men, Women, Kids Section */}
      <V2Categories v2={v2} lang={lang} />
      
      {/* 2. Our Picks section (Eti ekhon About er age ashbe) */}
      <V2Products v2={v2} lang={lang} />
      
      {/* 3. Made for confidence / About Us section (Our Picks er pore dewa holo) */}
      <V2About v2={v2} />
      
      <V2Promo v2={v2} />
      <V2Perks perks={v2.perks} title={v2.perksTitle} />
    </>
  );
}