import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2WishlistView from "@/components/v2/cart/V2WishlistView";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.wishlist.title} — AVENOR` } };
}

export default async function WishlistPage() {
  const { v2 } = await getV2Locale();
  return (
    <>
      <V2PageBanner title={v2.wishlist.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.wishlist.title }]} />
      <div className="v2-wrap v2-page">
        <V2WishlistView copy={v2.wishlist} />
      </div>
    </>
  );
}
