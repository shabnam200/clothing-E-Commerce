import { FiAward, FiLifeBuoy, FiLock, FiRefreshCw } from "react-icons/fi";

const ICONS = [FiAward, FiRefreshCw, FiLock, FiLifeBuoy];

export default function V2Perks({ perks }) {
  return (
    <section className="v2-wrap v2-block">
      <ul className="v2-perks">
        {perks.map(([title, text], i) => {
          const Icon = ICONS[i];
          return (
            <li key={title} className="v2-reveal">
              <span className="v2-perks__icon"><Icon aria-hidden="true" /></span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
