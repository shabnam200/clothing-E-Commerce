import Link from "next/link";
import V2Media from "@/components/v2/ui/V2Media";
import V2CircleCarousel from "@/components/v2/home/V2CircleCarousel";
import { existingImage } from "@/lib/v2/media";
import { fmtNum } from "@/lib/v2/format";
import { shopHref } from "@/lib/v2/filters";

// Top brands of the shop (best sellers first, max 8), shown right after the category circles. Hidden when there are no brands.
export default function V2Brands({ v2, lang, brands = [], titleOverride = "" }) {
  const b = v2.brands;
  const items = brands.slice(0, 8);
  if (!items.length) return null;

  return (
    <section id="shop-brands-section" className="v2-wrap v2-block" aria-labelledby="v2-brands-title">
      <div className="v2-sechead v2-reveal">
        <div className="v2-sechead__title">
          <p className="v2-eyebrow">{b.eyebrow}</p>
          <h2 id="v2-brands-title" className="v2-display v2-h2">{titleOverride || b.title}</h2>
        </div>
      </div>
      <V2CircleCarousel className="v2-circles--brands" label={b.title}>
        {items.map(({ id, name, image, isLogo, productCount }) => {
          const src = existingImage(image);
          return (
            <li key={id} className="v2-reveal">
              <Link href={shopHref({ brand: id })} className="v2-circle v2-zoom">
                <V2Media src={src} alt={name} sizes="140px" className={`v2-circle__img${isLogo ? " v2-circle__img--logo" : ""}`}>
                  {!src && <span className="v2-brand-initial" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
                </V2Media>
                <span>{name}</span>
                <small>{productCount === 1 ? b.countOne : b.count.replace("{n}", fmtNum(productCount, lang))}</small>
              </Link>
            </li>
          );
        })}
      </V2CircleCarousel>
    </section>
  );
}
