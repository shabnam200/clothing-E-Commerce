import SectionHeading from "@/components/ui/SectionHeading";
import ProductGrid from "@/components/product/ProductGrid";
import { FILTERS, PRODUCTS, discountPercent } from "@/data/products";
import { formatNumber, formatPrice } from "@/lib/format";

// Server: builds language-ready, serialisable view models; the client only filters + selects.
export default function NewArrivals({ t, lang }) {
  const { shop } = t;
  const branch = t.branches[0].split(",")[0];

  const items = PRODUCTS.map((p) => {
    const [name, categoryKey] = shop.items[p.id];
    return {
      id: p.id, gender: p.gender, image: p.image, sizes: p.sizes, soldOut: p.soldOut, name,
      category: t.categories.names[categoryKey],
      discount: discountPercent(p), discountText: `-${formatNumber(discountPercent(p), lang)}%`,
      price: formatPrice(p.price, lang), mrp: formatPrice(p.mrp, lang), left: shop.left(formatNumber(p.stock, lang), branch),
      colors: p.colors.map(([key, hex]) => ({ label: shop.colors[key] ?? key, hex })),
    };
  });
  const filters = FILTERS.map(({ id }) => ({ id, label: shop.filters[id] }));
  const labels = { filterLabel: shop.filterLabel, empty: shop.empty, color: shop.color, size: shop.size, mrp: shop.mrp, add: shop.add, wish: shop.wish };

  return (
    <section id="new-arrivals" className="bg-band py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading eyebrow={shop.eyebrow} title={shop.title} highlight={shop.highlight} />
        <ProductGrid items={items} filters={filters} labels={labels} />
      </div>
    </section>
  );
}
