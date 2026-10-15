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
  jackets: "jackets", jacket: "jackets", accessories: "accessories", "formal shirts": "shirts", "casual shirts": "shirts",
};
const GENDER_ALIASES = { men: "men", man: "men", women: "women", woman: "women", kids: "kids", kid: "kids", children: "kids" };

export default function V2Categories({ v2, lang, categories = [] }) {
  const c = v2.cats;
  const departmentGroups = categories
    .filter((category) => category.parent_id == null && Number(category.status ?? 1) === 1 && category.visible !== false)
    .map((department) => {
      const rawGender = String(department.name || department.slug || "").trim().toLowerCase().replace(/[^a-z]/g, "");
      const gender = GENDER_ALIASES[rawGender];
      if (!gender) return null;
      const fallback = V2_GENDERS.find((item) => item.key === gender);
      const children = (department.subs || [])
        .filter((category) => Number(category.status ?? 1) === 1 && category.visible !== false)
        .map((category) => {
          const rawKey = String(category.name || category.slug || "").trim().toLowerCase().replace(/\s+/g, " ");
          const key = CATEGORY_ALIASES[rawKey] || CATEGORY_ALIASES[rawKey.replace(/[^a-z0-9]/g, "")] || "";
          return key ? { key, name: c.names[key] || category.name } : null;
        })
        .filter(Boolean);
      return {
        gender,
        name: c.genders[gender] || department.name,
        image: department.image_url || department.image || fallback?.image,
        children,
      };
    })
    .filter(Boolean);
  const dynamicCategoryItems = categories
    .flatMap((category) => [category, ...(category.subs || [])])
    .filter((category) => Number(category.status ?? 1) === 1 && category.visible !== false)
    .map((category) => {
      const rawKey = String(category.key || category.slug || category.name || "").trim().toLowerCase();
      const key = CATEGORY_ALIASES[rawKey] || CATEGORY_ALIASES[rawKey.replace(/[^a-z0-9-]/g, "")] || "";
      const fallback = V2_CATEGORIES.find((item) => item.key === key);
      return key ? { key, name: c.names[key] || category.name, image: category.image_url || category.image || fallback?.image } : null;
    })
    .filter(Boolean);
  const categoryItems = dynamicCategoryItems.length
    ? dynamicCategoryItems
    : V2_CATEGORIES.map((category) => ({ ...category, name: c.names[category.key] }));
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
      {departmentGroups.length ? (
        <div className="v2-category-departments">
          {departmentGroups.map(({ gender, name, image, children }) => (
            <section key={gender} className="v2-category-department v2-reveal">
              <Link href={shopHref({ gender })} className="v2-circle v2-zoom v2-category-department__main">
                <V2Media src={image} alt="" sizes="120px" className="v2-circle__img" />
                <span>{name}</span>
              </Link>
              <nav className="v2-category-department__children" aria-label={`${name} categories`}>
                {children.map(({ key, name: childName }, index) => (
                  <Link key={`${key}-${index}`} href={shopHref({ gender, category: key })}>{childName}</Link>
                ))}
              </nav>
            </section>
          ))}
        </div>
      ) : (
        <ul className="v2-circles">
          {categoryItems.map(({ key, image, name }, index) => (
            <li key={`${key}-${index}`} className="v2-reveal">
              <Link href={shopHref({ category: key })} className="v2-circle v2-zoom">
                <V2Media src={image} alt="" sizes="120px" className="v2-circle__img" />
                <span>{name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
