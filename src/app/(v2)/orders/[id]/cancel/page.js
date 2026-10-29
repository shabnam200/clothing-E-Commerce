import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2OrderCancel from "@/components/v2/orders/V2OrderCancel";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";
import { getSettings } from "@/lib/v2/settings";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.orderCancel.title} — AVENOR` } };
}

export default async function OrderCancelPage({ params }) {
  const { v2 } = await getV2Locale();
  const { id } = await params;
  const oid = decodeURIComponent(id);
  return (
    <>
      <V2PageBanner title={v2.orderCancel.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.orderTrack.orders, href: ROUTES.orders }, ...(settings.featureToggles?.track_order !== false ? [{ label: v2.orderTrack.title, href: ROUTES.order(oid) }] : []), { label: v2.orderCancel.title }]} />
      <V2OrderCancel id={oid} copy={v2.orderCancel} trackCopy={v2.orderTrack} />
    </>
  );
}
