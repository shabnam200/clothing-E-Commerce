import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2CheckoutView from "@/components/v2/checkout/V2CheckoutView";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";
import { listPublicCoupons } from "@/services/dokani/coupons";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.checkout.title} \u2014 AVENOR` } };
}

export default async function CheckoutPage() {
  const [{ v2 }, availableCoupons] = await Promise.all([getV2Locale(), listPublicCoupons()]);
  return (
    <>
      <V2PageBanner title={v2.checkout.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.cart.title, href: ROUTES.cart }, { label: v2.checkout.title }]} />
      <div className="v2-wrap v2-page">
        <V2CheckoutView copy={v2.checkout} availableCoupons={availableCoupons} />
      </div>
    </>
  );
}
