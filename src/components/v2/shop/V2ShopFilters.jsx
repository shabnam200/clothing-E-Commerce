import Link from "next/link";
import { V2_CATEGORIES, V2_GENDERS } from "@/data/v2";
import { TAGS, shopHref } from "@/lib/v2/filters";

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
  const all = { key: "", text: v2.shop?.all || "All" };
  
  return (
    <div className="v2-filters">
      <Group label="Categories" name="category" value={f.category} f={f} options={[all, ...V2_CATEGORIES.map(({ key }) => ({ key, text: v2.cats.names[key] }))]} />
      <Group label="Gender" name="gender" value={f.gender} f={f} options={[all, ...V2_GENDERS.map(({ key }) => ({ key, text: v2.cats.genders[key] }))]} />
      
      {/* New Filters */}
      <Group label="Availability" name="availability" value={f.availability} f={f} options={[
        all, 
        { key: "in-stock", text: "In Stock" }, 
        { key: "out-of-stock", text: "Out of Stock" }
      ]} />
      
      <Group label="Price" name="price" value={f.price} f={f} options={[
        all, 
        { key: "under-500", text: "Under ৳500" }, 
        { key: "500-1000", text: "৳500 - ৳1000" }, 
        { key: "over-1000", text: "Over ৳1000" }
      ]} />

      <Group label="Color" name="color" value={f.color} f={f} options={[
        all, 
        { key: "black", text: "Black" }, 
        { key: "white", text: "White" },
        { key: "blue", text: "Blue" }
      ]} />

      <Group label="Size" name="size" value={f.size} f={f} options={[
        all, 
        { key: "s", text: "S" }, 
        { key: "m", text: "M" }, 
        { key: "l", text: "L" },
        { key: "xl", text: "XL" }
      ]} />

      <Group label="Brand" name="brand" value={f.brand} f={f} options={[
        all, 
        { key: "brand-1", text: "Brand 1" }, 
        { key: "brand-2", text: "Brand 2" }
      ]} />
    </div>
  );
}