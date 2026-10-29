import Link from "next/link";
import RemoteImage from "@/components/ui/RemoteImage";
import { ROUTES } from "@/config/v2";
import { getCatalog } from "@/lib/v2/catalogSource";

export default async function V2Looks({ looks = [], lang = "bn" }) {
  const active = (Array.isArray(looks) ? looks : []).filter((look) => look?.status !== false && look?.status !== 0 && look?.product_ids?.length);
  if (!active.length) return null;
  const catalog = await getCatalog(lang);
  const byId = new Map(catalog.map((product) => [String(product.id), product]));
  const title = lang === "en" ? "Our Looks" : "আমাদের লুক";
  return (
    <section className="v2-block v2-looks" aria-labelledby="v2-looks-title">
      <div className="v2-wrap">
        <div className="v2-center"><p className="v2-eyebrow">{title}</p><h2 id="v2-looks-title" className="v2-display v2-h2">{lang === "en" ? "Styled for you" : "আপনার জন্য সাজানো"}</h2></div>
        <div className="v2-looks__grid">
          {active.map((look, index) => {
            const products = look.product_ids.map((id) => byId.get(String(id))).filter((product) => product?.image).slice(0, 4);
            if (!products.length) return null;
            const href = typeof ROUTES.product === "function" ? ROUTES.product(products[0].id) : `/product/${products[0].id}`;
            return <Link className="v2-looks__card" href={href} key={`${look.title_en}-${index}`}>
              <div className="v2-looks__images">{products.map((product) => <span key={product.id}><RemoteImage src={product.image} alt={product.name || ""} sizes="(min-width: 900px) 20vw, 45vw" /></span>)}</div>
              <h3>{(lang === "bn" && look.title_bn) || look.title_en}</h3>
            </Link>;
          })}
        </div>
      </div>
    </section>
  );
}