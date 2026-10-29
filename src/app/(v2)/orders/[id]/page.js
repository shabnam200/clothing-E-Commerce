import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2OrderTracking from "@/components/v2/orders/V2OrderTracking";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";
import { getSettings } from "@/lib/v2/settings";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.orderTrack.title} — AVENOR` } };
}

export default async function OrderTrackingPage({ params }) {
  const [{ v2 }, settings] = await Promise.all([getV2Locale(), getSettings()]);
  if (settings.featureToggles?.track_order === false) notFound();
  const { id } = await params;
  return (
    <>
      <V2PageBanner title={v2.orderTrack.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.orderTrack.orders, href: ROUTES.orders }, { label: v2.orderTrack.title }]} />
      <V2OrderTracking id={decodeURIComponent(id)} copy={v2.orderTrack} returnsCopy={v2.returns} />
    </>
  );
}
