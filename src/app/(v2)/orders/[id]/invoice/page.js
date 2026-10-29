import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2OrderInvoice from "@/components/v2/orders/V2OrderInvoice";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";
import { getSettings } from "@/lib/v2/settings";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.invoice.title} — AVENOR` }, robots: { index: false } };
}

export default async function OrderInvoicePage({ params }) {
  const [{ v2 }, settings] = await Promise.all([getV2Locale(), getSettings()]);
  if (settings.featureToggles?.invoice === false) notFound();
  const oid = decodeURIComponent((await params).id);
  return (
    <>
      <V2PageBanner title={v2.invoice.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.orderTrack.orders, href: ROUTES.orders }, ...(settings.featureToggles?.order_details !== false ? [{ label: v2.orderDetails.title, href: ROUTES.orderDetails(oid) }] : []), { label: v2.invoice.title }]} />
      <V2OrderInvoice id={oid} copy={v2.invoice} trackCopy={v2.orderTrack} />
    </>
  );
}
