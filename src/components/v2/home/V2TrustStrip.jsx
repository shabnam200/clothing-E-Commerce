import { FiMapPin, FiRefreshCw, FiShield, FiTruck } from "react-icons/fi";

const ICONS = [FiTruck, FiRefreshCw, FiShield, FiMapPin];

const FALLBACK = [
  ["Free delivery", "On orders over the free-delivery minimum"],
  ["Easy returns", "Simple exchange within the return window"],
  ["Secure payments", "100% safe and secure checkout"],
  ["Local support", "Friendly help when you need it"],
];

// Service promises only — no fabricated customer reviews (the project has no review data yet).
// Custom pages can include this section for any locale, so it never assumes `v2.trust` exists.
export default function V2TrustStrip({ v2 }) {
  const items = Array.isArray(v2?.trust) && v2.trust.length ? v2.trust : FALLBACK;
  return (
    <section className="v2-band">
      <div className="v2-wrap">
        <ul className="v2-trust">
          {items.map((entry, i) => {
            const [title, text] = Array.isArray(entry) ? entry : [entry?.title, entry?.text];
            const Icon = ICONS[i % ICONS.length];
            return <li key={`${title}-${i}`} className="v2-reveal"><Icon aria-hidden="true" /><strong>{title}</strong><span>{text}</span></li>;
          })}
        </ul>
      </div>
    </section>
  );
}
