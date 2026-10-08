import { FiArrowUpRight } from "react-icons/fi";
import V2Coverflow from "@/components/v2/home/V2Coverflow";
import { existingImage } from "@/lib/v2/media";
import V2Pill from "@/components/v2/ui/V2Pill";
import { V2_COLLAGE } from "@/data/v2";
import { ROUTES } from "@/config/v2";

// Lookbook slideshow (its own page at /lookbook).
export default function V2Lookbook({ v2 }) {
  const a = v2.about;
  return (
    <section id="lookbook" className="v2-about" aria-label={v2.nav.lookbook}>
      <div className="v2-wrap">
        <V2Coverflow items={V2_COLLAGE.map((c, i) => ({
          id: c.id || c.productId || String(i + 1),
          src: existingImage(c.image),
          alt: a.alts[i] ?? "",
        }))} ctrl={a.ctrl} />
        <div className="v2-center">
          <V2Pill href={ROUTES.shop} variant="outline">{a.more} <FiArrowUpRight aria-hidden="true" /></V2Pill>
        </div>
      </div>
    </section>
  );
}
