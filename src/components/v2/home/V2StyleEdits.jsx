import Link from "next/link";
import V2Media from "@/components/v2/ui/V2Media";
import V2SectionHead from "@/components/v2/ui/V2SectionHead";
import { ROUTES } from "@/config/v2";

const EDITS = [
  { key: "panjabi", image: "/images/cat-panjabi.png" },
  { key: "summer", image: "/images/cat-summer.png" },
];

export default function V2StyleEdits({ v2 }) {
  // Custom pages can include this fixed section even when the active locale
  // does not define the optional `edits` copy. Keep the section renderable in
  // that case instead of crashing the entire page.
  const e = v2?.edits || {};
  const items = e.items || {};
  const labels = {
    panjabi: ["Panjabi", "A considered edit"],
    summer: ["Summer", "Explore the collection"],
  };
  return (
    <section className="v2-section">
      <div className="v2-wrap">
        <V2SectionHead eyebrow={e.eyebrow || "Style edits"} title={e.title || "Shop the edit"} />
        <ul className="v2-edits">
          {EDITS.map(({ key, image }) => (
            <li key={key} className="v2-reveal">
              <Link href={ROUTES?.shop || "/shop"} className="v2-edit v2-zoom">
                <V2Media src={image} alt={items[key]?.[0] || labels[key][0]} sizes="(min-width: 768px) 48vw, 100vw" />
                <div className="v2-edit__cap">
                  <h3>{items[key]?.[0] || labels[key][0]}</h3>
                  <p>{items[key]?.[1] || labels[key][1]}</p>
                  <span className="v2-link-arrow" style={{ width: "fit-content" }}>{e.cta || v2?.nav?.shop || "Shop now"}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
