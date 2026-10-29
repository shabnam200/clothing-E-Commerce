import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2OrderReturn from "@/components/v2/orders/V2OrderReturn";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";
import { getSettings } from "@/lib/v2/settings";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.orderReturn.title} — AVENOR` } };
}

export default async function OrderReturnPage({ params }) {
  const { v2 } = await getV2Locale();
  const oid = decodeURIComponent((await params).id);
  return (
    <>
      <V2PageBanner title={v2.orderReturn.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.orderTrack.orders, href: ROUTES.orders }, ...(settings.featureToggles?.order_details !== false ? [{ label: v2.orderDetails.title, href: ROUTES.orderDetails(oid) }] : []), { label: v2.orderReturn.title }]} />
      <V2OrderReturn id={oid} copy={v2.orderReturn} formCopy={v2.returns} trackCopy={v2.orderTrack} />
    </>
  );
}
