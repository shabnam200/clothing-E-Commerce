import { FiArrowUpRight } from "react-icons/fi";
import V2Coverflow from "@/components/v2/home/V2Coverflow";
import { existingImage } from "@/lib/v2/media";
import V2Pill from "@/components/v2/ui/V2Pill";
import { V2_COLLAGE } from "@/data/v2";
import { ROUTES } from "@/config/v2";

export default function V2About({ v2 }) {
  const a = v2.about;
  return (
    <section id="about" className="v2-about" aria-labelledby="v2-about-title">
      <div className="v2-wrap">
        <div className="v2-center v2-reveal">
          <p className="v2-eyebrow">{a.eyebrow}</p>
          <h2 id="v2-about-title" className="v2-display v2-h2">{a.title}</h2>
          <p className="v2-lede">{a.text}</p>
        </div>
      </div>
      <div id="lookbook" className="v2-wrap">
        <V2Coverflow items={V2_COLLAGE.map((c, i) => ({ src: existingImage(c.image), alt: a.alts[i] ?? "" }))} ctrl={a.ctrl} />
        <div className="v2-center"><V2Pill href={ROUTES.shop} variant="outline">{a.more} <FiArrowUpRight aria-hidden="true" /></V2Pill></div>
      </div>
    </section>
  );
}
