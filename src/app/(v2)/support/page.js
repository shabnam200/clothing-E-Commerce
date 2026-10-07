import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2SupportView from "@/components/v2/support/V2SupportView";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.support.title} — AVENOR` } };
}

export default async function SupportPage({ searchParams }) {
  const { v2 } = await getV2Locale();
  const raw = (await searchParams)?.order;
  const order = (Array.isArray(raw) ? raw[0] : raw)?.toString().slice(0, 24) ?? "";
  return (
    <>
      <V2PageBanner title={v2.support.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.support.title }]} />
      <V2SupportView copy={v2.support} order={order} />
    </>
  );
}
