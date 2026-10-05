import V2ProductCard from "./V2ProductCard";

// Responsive product grid (2 / 3 / 4 columns). `items` come from lib/v2/catalog.js.
export default function V2ProductGrid({ items, className = "" }) {
  return (
    <ul className={`v2-pgrid ${className}`.trim()}>
      {items.map((p) => <li key={p.id}><V2ProductCard p={p} /></li>)}
    </ul>
  );
}
