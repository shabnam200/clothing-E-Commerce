import V2CartView from "@/components/v2/cart/V2CartView";
import { getV2Locale } from "@/lib/v2/i18n";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.cart.title} — AVENOR` } };
}

export default async function CartPage() {
  const { v2 } = await getV2Locale();
  return (
    <div className="v2-wrap v2-page">
      <h1 className="v2-display v2-h2 v2-page__title">{v2.cart.title}</h1>
      <V2CartView copy={v2.cart} />
    </div>
  );
}
