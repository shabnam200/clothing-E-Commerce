"use client";

import { useState } from "react";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import { filterProducts } from "@/lib/v2/filters";

export default function V2ShopResults({ initialItems, meta, filters, groupingMode, lang }) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(meta.page || 1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasMore = page < (meta.last_page || 1);
  const sortedItems = filterProducts(items, filters);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setFailed(false);
    try {
      const nextPage = page + 1;
      const query = new URLSearchParams({ page: String(nextPage), limit: String(meta.limit || 24), mode: groupingMode, lang });
      for (const [key, value] of Object.entries(filters)) if (value) query.set(key, String(value));
      const response = await fetch(`/api/storefront/products?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load more products");
      const result = await response.json();
      setItems((current) => [...current, ...(result.items || []).filter((item) => !current.some((existing) => String(existing.id) === String(item.id)))]);
      setPage(nextPage);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {sortedItems.length > 0 && <V2ProductGrid items={sortedItems} wrap />}
      {(hasMore || failed) && <div className="v2-shop-load-more">
        <button type="button" className="v2-pill v2-pill--outline" onClick={loadMore} disabled={loading}>
          {loading ? (lang === "bn" ? "লোড হচ্ছে…" : "Loading…") : failed ? (lang === "bn" ? "আবার চেষ্টা করুন" : "Try again") : (lang === "bn" ? "আরও পণ্য দেখুন" : "Load more products")}
        </button>
      </div>}
    </>
  );
}
