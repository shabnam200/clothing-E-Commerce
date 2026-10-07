import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import V2Media from "@/components/v2/ui/V2Media";
import V2SectionHead from "@/components/v2/ui/V2SectionHead";
import { CATEGORIES } from "@/data/categories";
import { formatNumber } from "@/lib/format";

export default function V2CategorySection({ t, v2, lang }) {
  const c = v2.categories;
  return (
    <section id="collections" className="v2-section">
      <div className="v2-wrap">
        <V2SectionHead eyebrow={c.eyebrow} title={c.title} />
        <ul className="v2-cats">
          {CATEGORIES.map(({ key, styles, image }, i) => (
            <li key={key} className="v2-reveal">
              <Link href="/#new-arrivals" className="v2-cat v2-zoom">
                <V2Media src={image} alt={t.categories.names[key]} tone={i + 1} label={t.categories.names[key]} sizes="(min-width: 1024px) 24vw, 72vw" />
                <div className="v2-cat__cap">
                  <h3>{t.categories.names[key]}</h3>
                  <span>{formatNumber(styles, lang)} {t.categories.styles} · {c.explore} <FiArrowRight aria-hidden="true" style={{ verticalAlign: "-2px" }} /></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
