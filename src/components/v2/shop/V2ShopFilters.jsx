import Link from "next/link";
import { V2_CATEGORIES, V2_GENDERS } from "@/data/v2";
import { TAGS, shopHref } from "@/lib/v2/filters";

// Filter chips are plain links to /v2/shop?... so every filter is shareable, back-button friendly and works without JS.
function Group({ label, name, value, options, f }) {
  return (
    <div className="v2-filter" role="group" aria-label={label}>
      <span className="v2-filter__label" aria-hidden="true">{label}</span>
      <ul className="v2-chips">
        {options.map(({ key, text }) => {
          const on = (key === "" && !value) || key === value;
          return (
            <li key={key || "all"}>
              <Link scroll={false} href={shopHref({ ...f, [name]: key })} className="v2-chip" aria-current={on ? "true" : undefined}>{text}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function V2ShopFilters({ v2, f }) {
  const all = { key: "", text: v2.shop.all };
  return (
    <div className="v2-filters">
      <Group label={v2.shop.groups} name="tag" value={f.tag} f={f} options={[all, ...TAGS.map((k) => ({ key: k, text: v2.products.tabs[k] }))]} />
      <Group label={v2.shop.forWho} name="gender" value={f.gender} f={f} options={[all, ...V2_GENDERS.map(({ key }) => ({ key, text: v2.cats.genders[key] }))]} />
      <Group label={v2.shop.categoryLabel} name="category" value={f.category} f={f} options={[all, ...V2_CATEGORIES.map(({ key }) => ({ key, text: v2.cats.names[key] }))]} />
    </div>
  );
}
