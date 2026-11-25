"use client";

import { useEffect, useRef, useState } from "react";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import { filterProducts } from "@/lib/v2/filters";

const MAX_AUTO_PAGES = 8; // when a page has no match, look at up to this many following pages by itself before asking the visitor to press the button

export default function V2ShopResults({ initialItems, meta, filters, groupingMode, lang, empty = null }) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(meta.page || 1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const autoPages = useRef(0);
  const hasMore = page < (meta.last_page || 1);
  const sortedItems = filterProducts(items, filters);
  const noMatches = sortedItems.length === 0;
  const autoLoading = noMatches && hasMore && !failed && autoPages.current < MAX_AUTO_PAGES;
  const t = lang === "bn" ? { loading: "লোড হচ্ছে…", retry: "আবার চেষ্টা করুন", more: "আরও পণ্য দেখুন" } : { loading: "Loading…", retry: "Try again", more: "Load more products" };

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

  // The first page can hold none of the products that match the filters (they are on a later page). Keep looking instead of showing an
  // empty grid with a Load more button.
  useEffect(() => {
    if (noMatches && hasMore && !loading && !failed && autoPages.current < MAX_AUTO_PAGES) {
      autoPages.current += 1;
      loadMore();
    }
  });

  return (
    <>
      {!noMatches && <V2ProductGrid items={sortedItems} wrap />}
      {noMatches && !hasMore && !loading && !failed && empty}
      {autoLoading && <p role="status" className="v2-shop-load-more" style={{ textAlign: "center" }}>{t.loading}</p>}
      {!autoLoading && (hasMore || failed) && <div className="v2-shop-load-more">
        <button type="button" className="v2-pill v2-pill--outline" onClick={loadMore} disabled={loading}>
          {loading ? t.loading : failed ? t.retry : t.more}
        </button>
      </div>}
    </>
  );
}
