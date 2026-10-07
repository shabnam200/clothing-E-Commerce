import Link from "next/link";
import V2Media from "@/components/v2/ui/V2Media";
import V2GenderCarousel from "@/components/v2/home/V2GenderCarousel";
import { existingImage } from "@/lib/v2/media";
import { V2_CATEGORIES, V2_GENDERS } from "@/data/v2";
import { fmtNum } from "@/lib/v2/format";
import { shopHref } from "@/lib/v2/filters";

export default function V2Categories({ v2, lang }) {
  const c = v2.cats;
  return (
    // Added ID here for smooth scrolling
// V2Categories.jsx এর ভেতরের প্রথম লাইনটি এমন হবে:
    <section id="shop-categories-section" className="v2-wrap v2-block" aria-labelledby="v2-cats-title">      <div className="v2-reveal">
        <V2GenderCarousel
          label={c.pick}
          shopNow={c.shopNow}
          items={V2_GENDERS.map(({ key, off, image }) => ({ key, name: c.genders[key], href: shopHref({ gender: key }), off: c.off.replace("{n}", fmtNum(off, lang)), src: existingImage(image) }))}
        />
      </div>

      <div className="v2-center v2-cats-head v2-reveal">
        <p className="v2-eyebrow">{c.eyebrow}</p>
        <h2 id="v2-cats-title" className="v2-display v2-h2">{c.title}</h2>
      </div>
      <ul className="v2-circles">
        {V2_CATEGORIES.map(({ key, image }) => (
          <li key={key} className="v2-reveal">
            <Link href={shopHref({ category: key })} className="v2-circle v2-zoom">
              <V2Media src={image} alt="" sizes="120px" className="v2-circle__img" />
              <span>{c.names[key]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}