import { FiAward, FiRefreshCw, FiShield, FiHeadphones } from "react-icons/fi";

const ICONS = [FiAward, FiRefreshCw, FiShield, FiHeadphones];

// "Why choose us" band. Theme-aware: soft tint in light mode, warm charcoal in dark mode.
export default function V2Perks({ perks, title }) {
  return (
    <section className="v2-why" aria-label={title}>
      <div className="v2-wrap">
        {title && <h2 className="v2-why__title">{title}</h2>}
        <ul className="v2-why__list">
          {perks.map(([head, text], i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={head} className="v2-reveal">
                <span className="v2-why__icon"><Icon aria-hidden="true" strokeWidth={1.5} /></span>
                <h3>{head}</h3>
                <p>{text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
