import V2WishlistView from "@/components/v2/cart/V2WishlistView";
import { getV2Locale } from "@/lib/v2/i18n";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.wishlist.title} — AVENOR` } };
}

export default async function WishlistPage() {
  const { v2 } = await getV2Locale();
  return (
    <div className="v2-wrap v2-page">
      <h1 className="v2-display v2-h2 v2-page__title">{v2.wishlist.title}</h1>
      <V2WishlistView copy={v2.wishlist} />
    </div>
  );
}
