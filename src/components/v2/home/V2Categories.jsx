import Link from "next/link";
import V2Media from "@/components/v2/ui/V2Media";
import V2GenderCarousel from "@/components/v2/home/V2GenderCarousel";
import V2CircleCarousel from "@/components/v2/home/V2CircleCarousel";
import { existingImage } from "@/lib/v2/media";
import { V2_GENDERS } from "@/data/v2";
import { shopHref } from "@/lib/v2/filters";
import { categoryKey as dynamicCategoryKey, categoryPathKeyForGrouping } from "@/lib/v2/categoryKey";
import { fmtNum } from "@/lib/v2/format";

const GENDER_ALIASES = { men: "men", man: "men", women: "women", woman: "women", kids: "kids", kid: "kids", children: "kids" };

export default function V2Categories({ v2, lang, categories = [], titleOverride = "", showGender = true, showCategories = true, groupingMode = "category" }) {
  const c = v2.cats;
  const departments = categories
    .filter((category) => category.parent_id == null && Number(category.status ?? 1) === 1 && category.visible !== false)
    .map((department) => {
      const rawGender = String(department.name || department.slug || "").trim().toLowerCase().replace(/[^a-z]/g, "");
      const gender = GENDER_ALIASES[rawGender];
      return gender ? { gender, image: department.image_url || department.image } : null;
    }).filter(Boolean);

  // The feature cards follow the shop's top-level categories from Dokani. Keep
  // this list independent from the clothing-specific gender aliases below.
  const headCategories = categories
    .filter((category) => category.parent_id == null && Number(category.status ?? 1) === 1 && category.visible !== false)
    .map((category) => {
      const categoryKey = categoryPathKeyForGrouping(category, "", "category");
      return categoryKey ? {
        key: categoryKey,
        name: category.name,
        href: shopHref({ category: categoryKey }),
        image: existingImage(category.image_url || category.image),
      } : null;
    })
    .filter(Boolean);
  const carouselItems = groupingMode === "category"
    ? headCategories.map((category) => ({ ...category, src: category.image }))
    : V2_GENDERS.map(({ key, off, image }) => ({ key, name: c.genders[key], href: shopHref({ gender: key }), off: c.off.replace("{n}", fmtNum(off, lang)), src: existingImage(departments.find((department) => department.gender === key)?.image) || existingImage(image) }));

  const categoryMap = new Map();
  const collectCategories = (rows, parentKey = "", depth = 0) => rows.forEach((category) => {
    if (Number(category.status ?? 1) !== 1 || category.visible === false) return;
    const key = groupingMode === "category"
      ? categoryPathKeyForGrouping(category, parentKey, "category")
      : dynamicCategoryKey(category);
    if (depth > 0 && key) {
      const existing = categoryMap.get(key);
      if (!existing) categoryMap.set(key, { key, name: category.name, image: category.image_url || category.image || null, sold_quantity: Number(category.sold_quantity) || 0 });
      else existing.sold_quantity += Number(category.sold_quantity) || 0;
    }
    collectCategories(category.subs || [], groupingMode === "category" ? key || parentKey : "", depth + 1);
  });
  collectCategories(categories);
  const rankedCategories = [...categoryMap.values()].sort((a, b) => b.sold_quantity - a.sold_quantity);
  const categoryItems = rankedCategories.length ? rankedCategories : groupingMode === "category" ? headCategories : [];

  return (
    <>
      {showGender && groupingMode !== "hidden" && carouselItems.length > 0 && <section className="v2-wrap v2-block v2-gender-section" aria-label={c.pick}>
        <div className="v2-reveal">
          <V2GenderCarousel
            label={c.pick}
            shopNow={c.shopNow}
            items={carouselItems}
          />
        </div>
      </section>}

      {showCategories && <section id="shop-categories-section" className="v2-wrap v2-block" aria-labelledby="v2-cats-title">
        <div className="v2-sechead v2-reveal">
          <div className="v2-sechead__title">
            <p className="v2-eyebrow">{c.eyebrow}</p>
            <h2 id="v2-cats-title" className="v2-display v2-h2">{titleOverride || c.title}</h2>
          </div>
        </div>
        <V2CircleCarousel label={c.title}>
          {categoryItems.map(({ key, image, name, href }, index) => (
            <li key={`${key}-${index}`} className="v2-reveal">
              <Link href={href || shopHref({ category: key })} className="v2-circle v2-zoom">
                <V2Media src={image} alt="" sizes="120px" className="v2-circle__img" />
                <span>{name || c.names[key] || key}</span>
              </Link>
            </li>
          ))}
        </V2CircleCarousel>
      </section>}
    </>
  );
}
