import Link from "next/link";
import V2Media from "@/components/v2/ui/V2Media";
import V2SectionHead from "@/components/v2/ui/V2SectionHead";

const EDITS = [
  { key: "panjabi", image: "/images/categories/panjabi.jpg", tone: 3 },
  { key: "summer", image: "/images/categories/summer.jpg", tone: 4 },
];

export default function V2StyleEdits({ v2 }) {
  const e = v2.edits;
  return (
    <section className="v2-section">
      <div className="v2-wrap">
        <V2SectionHead eyebrow={e.eyebrow} title={e.title} />
        <ul className="v2-edits">
          {EDITS.map(({ key, image, tone }) => (
            <li key={key} className="v2-reveal">
              <Link href="/v2#new-arrivals" className="v2-edit v2-zoom">
                <V2Media src={image} alt={e.items[key][0]} tone={tone} label={e.items[key][0]} sizes="(min-width: 768px) 48vw, 100vw" />
                <div className="v2-edit__cap">
                  <h3>{e.items[key][0]}</h3>
                  <p>{e.items[key][1]}</p>
                  <span className="v2-link-arrow" style={{ width: "fit-content" }}>{e.cta}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
