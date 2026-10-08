"use client";

import Link from "next/link";
import { FiHeart } from "react-icons/fi";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import V2PriceAlerts from "@/components/v2/cart/V2PriceAlerts";
import { ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

export default function V2WishlistView({ copy }) {
  const { catalog, wish, hydrated, fill, num } = useV2Store();
  if (!hydrated) return <p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /> {copy.loading}</p>;
  const items = catalog.filter((p) => wish.includes(p.id));
  if (items.length === 0) {
    return (
      <V2EmptyState icon={<FiHeart />} title={copy.emptyTitle} text={copy.emptyText}>
        <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{copy.browse}</Link>
      </V2EmptyState>
    );
  }
  return (
    <>
      <p className="v2-cart__count">{items.length === 1 ? copy.itemOne : fill(copy.items, { n: num(items.length) })}</p>
      <V2ProductGrid items={items} />
      <V2PriceAlerts items={items} copy={copy.alerts} />
    </>
  );
}
