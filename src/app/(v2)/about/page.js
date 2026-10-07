import V2About from "@/components/v2/home/V2About";
import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.nav.about} — AVENOR` } };
}

// About + Lookbook live together on one page: /about (lookbook anchor: /about#lookbook).
export default async function AboutPage() {
  const { v2 } = await getV2Locale();
  return (
    <>
      <V2PageBanner title={v2.nav.about} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.nav.about }]} />
      <V2About v2={v2} />
    </>
  );
}
