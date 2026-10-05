import V2Button from "@/components/v2/ui/V2Button";
import V2Media from "@/components/v2/ui/V2Media";

export default function V2FeaturedCollection({ v2 }) {
  const f = v2.feature;
  return (
    <section className="v2-section">
      <div className="v2-wrap">
        <div className="v2-feature v2-reveal">
          <V2Media src="/images/categories/casual.jpg" alt={f.imgAlt} tone={2} label={f.title} sizes="(min-width: 900px) 55vw, 100vw" className="v2-feature__img" />
          <div className="v2-feature__copy">
            <p className="v2-eyebrow" style={{ margin: 0 }}>{f.eyebrow}</p>
            <h2 className="v2-h2">{f.title}</h2>
            <p className="v2-lede">{f.text}</p>
            <div><V2Button href="/v2#collections" variant="solid">{f.cta}</V2Button></div>
          </div>
        </div>
      </div>
    </section>
  );
}
