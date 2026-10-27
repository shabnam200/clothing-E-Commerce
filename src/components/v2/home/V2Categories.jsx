import Link from "next/link";
import V2Media from "@/components/v2/ui/V2Media";
import V2GenderCarousel from "@/components/v2/home/V2GenderCarousel";
import { existingImage } from "@/lib/v2/media";
import { V2_CATEGORIES, V2_GENDERS } from "@/data/v2";
import { fmtNum } from "@/lib/v2/format";
import { shopHref } from "@/lib/v2/filters";

const CATEGORY_ALIASES = {
  shirts: "shirts", shirt: "shirts", tshirts: "tshirts", tshirt: "tshirts", "t-shirts": "tshirts", "t-shirt": "tshirts", "t shirts": "tshirts", "t shirt": "tshirts",
  jeans: "jeans", denim: "jeans", pants: "jeans", trousers: "jeans", dresses: "dresses", dress: "dresses", kurtas: "kurtas", kurta: "kurtas", panjabi: "kurtas",
  jackets: "jackets", jacket: "jackets", shoes: "shoes", shoe: "shoes", footwear: "shoes", accessories: "accessories", accessory: "accessories", accesories: "accessories", accesory: "accessories", "formal shirts": "shirts", "casual shirts": "shirts",
};
const GENDER_ALIASES = { men: "men", man: "men", women: "women", woman: "women", kids: "kids", kid: "kids", children: "kids" };
const GENDER_WORDS = new Set(["men", "man", "mens", "women", "woman", "womens", "kids", "kid", "children", "boys", "girls"]);

function categoryKey(category) {
  const candidates = [category.name, category.key, category.slug].filter(Boolean);
  for (const candidate of candidates) {
    const normalized = String(candidate).toLowerCase().replace(/[’']s\b/g, "").replace(/[_-]+/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    const compact = normalized.replace(/\s+/g, "");
    const stripped = normalized.split(/\s+/).filter((word) => !GENDER_WORDS.has(word)).join(" ");
    const strippedCompact = stripped.replace(/\s+/g, "");
    const direct = CATEGORY_ALIASES[normalized] || CATEGORY_ALIASES[compact] || CATEGORY_ALIASES[stripped] || CATEGORY_ALIASES[strippedCompact];
    if (direct) return direct;
    if (/accessor|accesor/.test(strippedCompact)) return "accessories";
    if (/footwear|shoes?/.test(compact)) return "shoes";
  }
  return null;
}

export default function V2Categories({ v2, lang, categories = [] }) {
  const c = v2.cats;
  const departments = categories
    .filter((category) => category.parent_id == null && Number(category.status ?? 1) === 1 && category.visible !== false)
    .map((department) => {
      const rawGender = String(department.name || department.slug || "").trim().toLowerCase().replace(/[^a-z]/g, "");
      const gender = GENDER_ALIASES[rawGender];
      return gender ? { gender, image: department.image_url || department.image, children: (department.subs || [])
        .filter((category) => Number(category.status ?? 1) === 1 && category.visible !== false)
        .map((category) => {
          const rawKey = String(category.name || category.slug || "").trim().toLowerCase().replace(/\s+/g, " ");
          const key = categoryKey(category) || category.slug || rawKey.replace(/[^a-z0-9]+/g, "-");
          const fallback = V2_CATEGORIES.find((item) => item.key === key);
          return key ? { key, name: c.names[key] || category.name, image: category.image_url || category.image || fallback?.image || V2_CATEGORIES[0]?.image, sold_quantity: Number(category.sold_quantity) || 0 } : null;
        }).filter(Boolean) } : null;
    }).filter(Boolean);

  const categoryMap = new Map();
  departments.forEach(({ children }) => children.forEach((item) => {
    const existing = categoryMap.get(item.key);
    if (!existing) categoryMap.set(item.key, item);
    else existing.sold_quantity += item.sold_quantity || 0;
  }));
  if (!categoryMap.size) {
    categories.filter((category) => category.parent_id != null && Number(category.status ?? 1) === 1 && category.visible !== false).forEach((category) => {
      const key = categoryKey(category);
      const fallback = V2_CATEGORIES.find((item) => item.key === key);
      if (key && !categoryMap.has(key)) categoryMap.set(key, { key, name: c.names[key] || category.name, image: category.image_url || category.image || fallback?.image || V2_CATEGORIES[0]?.image, sold_quantity: Number(category.sold_quantity) || 0 });
    });
  }
  const rankedCategories = [...categoryMap.values()].sort((a, b) => b.sold_quantity - a.sold_quantity);
  const categoryItems = (categoryMap.size
    ? rankedCategories
    : V2_CATEGORIES.filter((item) => item.key !== "jackets").map((item) => ({ ...item, name: c.names[item.key], sold_quantity: 0 })))
    .slice(0, 7);

  return (
    <>
      <section className="v2-wrap v2-block v2-gender-section" aria-label={c.pick}>
        <div className="v2-reveal">
          <V2GenderCarousel
            label={c.pick}
            shopNow={c.shopNow}
            items={V2_GENDERS.map(({ key, off, image }) => ({ key, name: c.genders[key], href: shopHref({ gender: key }), off: c.off.replace("{n}", fmtNum(off, lang)), src: existingImage(departments.find((department) => department.gender === key)?.image) || existingImage(image) }))}
          />
        </div>
      </section>

      <section id="shop-categories-section" className="v2-wrap v2-block" aria-labelledby="v2-cats-title">
        <div className="v2-center v2-cats-head v2-reveal">
          <p className="v2-eyebrow">{c.eyebrow}</p>
          <h2 id="v2-cats-title" className="v2-display v2-h2">{c.title}</h2>
        </div>
        <ul className="v2-circles">
          {categoryItems.map(({ key, image, name }, index) => (
            <li key={`${key}-${index}`} className="v2-reveal">
              <Link href={shopHref({ category: key })} className="v2-circle v2-zoom">
                <V2Media src={image} alt="" sizes="120px" className="v2-circle__img" />
                <span>{name || c.names[key] || key}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
