"use client";

import Link from "next/link";
import { FiBell, FiChevronDown, FiHeart } from "react-icons/fi";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import V2PriceAlerts from "@/components/v2/cart/V2PriceAlerts";
import { ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { useAlerts } from "@/lib/v2/priceAlerts";

export default function V2WishlistView({ copy }) {
  const { catalog, wish, hydrated, num, settings } = useV2Store();
  const { items: activeAlerts } = useAlerts();
  if (!hydrated) return <p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /> {copy.loading}</p>;
  const items = catalog.filter((p) => wish.includes(p.id));
  if (items.length === 0) {
    return (
      <div className="v2-wl v2-wl--empty">
        <V2EmptyState icon={<FiHeart />} title={copy.emptyTitle} text={copy.emptyText}>
          <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{copy.browse}</Link>
        </V2EmptyState>
      </div>
    );
  }
  const alertsOn = settings?.featureToggles?.price_drop_alerts !== false;
  const alertCount = items.filter((p) => activeAlerts?.[p.id]).length;
  return (
    <div className="v2-wl">
      <V2ProductGrid items={items} wrap />
      {alertsOn && (
        <details className="v2-wl__alerts">
          <summary>
            <FiBell aria-hidden="true" />
            <span className="v2-wl__alerts-title">{copy.alerts.title}</span>
            {alertCount > 0 && <em className="v2-wl__badge">{num(alertCount)}</em>}
            <FiChevronDown className="v2-wl__chev" aria-hidden="true" />
          </summary>
          <V2PriceAlerts items={items} copy={copy.alerts} />
        </details>
      )}
    </div>
  );
}

