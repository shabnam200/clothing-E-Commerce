import V2Hero from "@/components/v2/home/V2Hero";
import V2Categories from "@/components/v2/home/V2Categories";
import V2Products from "@/components/v2/home/V2Products";
import V2Lookbook from "@/components/v2/home/V2Lookbook";
import V2Promo from "@/components/v2/home/V2Promo";
import V2Perks from "@/components/v2/home/V2Perks";
import { getActiveCampaigns } from "@/lib/v2/campaigns";
import { getV2Locale } from "@/lib/v2/i18n";

export default async function V2HomePage() {
  const { v2, lang } = await getV2Locale();
  const campaigns = await getActiveCampaigns(lang); // festival slides for the promo section (empty when none is live)
  return (
    <>
      <V2Hero v2={v2} />
      
      {/* 1. Men, Women, Kids Section */}
      <V2Categories v2={v2} lang={lang} />
      
      {/* 2. Our Picks section  */}
      <V2Products v2={v2} lang={lang} />

      {/* 3. Lookbook section (nav link scrolls here: /#lookbook) */}
      <V2Lookbook v2={v2} />

      <V2Promo v2={v2} lang={lang} campaigns={campaigns} />
      <V2Perks perks={v2.perks} title={v2.perksTitle} />
    </>
  );
}