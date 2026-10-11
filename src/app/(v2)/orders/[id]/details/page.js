import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2OrderDetails from "@/components/v2/orders/V2OrderDetails";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.orderDetails.title} — AVENOR` } };
}

export default async function OrderDetailsPage({ params }) {
  const { v2 } = await getV2Locale();
  const oid = decodeURIComponent((await params).id);
  return (
    <>
      <V2PageBanner title={v2.orderDetails.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.orderTrack.orders, href: ROUTES.orders }, { label: v2.orderDetails.title }]} />
      <V2OrderDetails id={oid} copy={v2.orderDetails} trackCopy={v2.orderTrack} returnsCopy={v2.returns} />
    </>
  );
}
