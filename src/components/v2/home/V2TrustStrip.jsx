import { FiMapPin, FiRefreshCw, FiShield, FiTruck } from "react-icons/fi";

const ICONS = [FiTruck, FiRefreshCw, FiShield, FiMapPin];

// Service promises only — no fabricated customer reviews (the project has no review data yet).
export default function V2TrustStrip({ v2 }) {
  return (
    <section className="v2-band" style={{ paddingBlock: "clamp(36px, 5vw, 64px)" }}>
      <div className="v2-wrap">
        <ul className="v2-trust">
          {v2.trust.map(([title, text], i) => {
            const Icon = ICONS[i];
            return <li key={title} className="v2-reveal"><Icon aria-hidden="true" /><strong>{title}</strong><span>{text}</span></li>;
          })}
        </ul>
      </div>
    </section>
  );
}
