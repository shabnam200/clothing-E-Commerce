import V2Lookbook from "@/components/v2/home/V2Lookbook";
import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.nav.lookbook} — AVENOR` } };
}

export default async function LookbookPage() {
  const { v2 } = await getV2Locale();
  return (
    <>
      <V2PageBanner title={v2.nav.lookbook} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.nav.lookbook }]} />
      <V2Lookbook v2={v2} />
    </>
  );
}
