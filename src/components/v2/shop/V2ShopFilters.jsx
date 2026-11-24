"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { V2_GENDERS } from "@/data/v2";
import { shopHref } from "@/lib/v2/filters";
import { categoryPathKeyForGrouping } from "@/lib/v2/categoryKey";
import { FiChevronDown, FiChevronUp, FiSliders, FiX } from "react-icons/fi";

const PRICE_MAX = 5000;

// A section starts open when it matters (it has an active value, or it is a main section); the rest stay folded so the sidebar is short.
function Accordion({ title, defaultOpen = true, active = false, children }) {
  const [open, setOpen] = useState(defaultOpen || active);
  const id = useId();
  return (
    <div className="v2-fp__section">
      <button type="button" className="v2-fp__head" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={id}>
        <span>{title}{active && !open ? <i className="v2-fp__dot" aria-label="active" /> : null}</span>
        {open ? <FiChevronUp size={16} aria-hidden="true" /> : <FiChevronDown size={16} aria-hidden="true" />}
      </button>
      {open && <div id={id} className="v2-fp__body">{children}</div>}
    </div>
  );
}

const GENDER_KEYS = { men: "men", man: "men", women: "women", woman: "women", kids: "kids", kid: "kids", children: "kids" };
const normalized = (value) => String(value || "").toLowerCase().replace(/[’']s\b/g, "").replace(/[_-]+/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const AVAILABILITY = [{ key: "in-stock", text: "In Stock" }, { key: "out-of-stock", text: "Out of Stock" }];
const COLORS = [
  { key: "black", text: "Black", hex: "var(--v2-sw-black)" }, { key: "white", text: "White", hex: "var(--v2-sw-white)" },
  { key: "blue", text: "Blue", hex: "var(--v2-sw-blue)" }, { key: "brown", text: "Brown", hex: "var(--v2-sw-brown)" },
  { key: "red", text: "Red", hex: "var(--v2-sw-red)" },
];
const SIZES = ["S", "M", "L", "XL"];

export default function V2ShopFilters({ cats, categoryTree = [], groupingMode = "category", brands = [], brandsTitle = "Brands", f, resultCount }) {
  const router = useRouter();
  const panelId = useId();
  const [mobileOpen, setMobileOpen] = useState(false);
  const departments = (Array.isArray(categoryTree) ? categoryTree : []).filter((item) => Number(item.status ?? 1) === 1 && item.visible !== false);

  // Price slider state
  const currentMax = f.price && /^\d+$/.test(f.price) ? Number(f.price) : PRICE_MAX;
  const [priceVal, setPriceVal] = useState(currentMax);
  useEffect(() => { setPriceVal(currentMax); }, [currentMax]);

  const applyPrice = (raw) => {
    const val = Number(raw);
    router.push(shopHref({ ...f, price: val < PRICE_MAX ? String(val) : "" }), { scroll: false });
  };

  const findDepartment = (key) => departments.find((item) => (GENDER_KEYS[normalized(item.name)] || GENDER_KEYS[normalized(item.slug)]) === key);
  const availableCategories = (nodes, parentKey = "") => (nodes || [])
    .filter((item) => Number(item.status ?? 1) === 1 && item.visible !== false)
    .map((item) => {
      const key = categoryPathKeyForGrouping(item, parentKey, groupingMode);
      return key ? { ...item, key, subs: availableCategories(item.subs, key) } : null;
    }).filter(Boolean).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  // Chips for everything that is currently applied, each one removes only itself.
  const chips = [];
  if (f.gender) chips.push({ key: "gender", label: cats.genders?.[f.gender] || f.gender, next: { ...f, gender: "", category: "" } });
  if (f.category) chips.push({ key: "category", label: cats.names?.[f.category] || f.category.replace(/-/g, " "), next: { ...f, category: "" } });
  if (f.brand) chips.push({ key: "brand", label: brands.find((b) => b.id === f.brand)?.name || "Brand", next: { ...f, brand: "" } });
  if (f.availability) chips.push({ key: "availability", label: AVAILABILITY.find((a) => a.key === f.availability)?.text || f.availability, next: { ...f, availability: "" } });
  if (f.price) chips.push({ key: "price", label: /^\d+$/.test(f.price) ? `Up to ৳${f.price}` : f.price, next: { ...f, price: "" } });
  if (f.color) chips.push({ key: "color", label: COLORS.find((c) => c.key === f.color)?.text || f.color, next: { ...f, color: "" } });
  if (f.size) chips.push({ key: "size", label: f.size.toUpperCase(), next: { ...f, size: "" } });
  const activeCount = chips.length;

  const check = (active, round = false) => (
    <span className={`v2-fp__check${round ? " is-round" : ""}${active ? " is-on" : ""}`} aria-hidden="true">{active && <span />}</span>
  );

  return (
    <div className="v2-fp">
      <button type="button" className="v2-fp__toggle" onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen} aria-controls={panelId}>
        <span><FiSliders size={16} aria-hidden="true" /> Filters{activeCount > 0 && <b className="v2-fp__badge">{activeCount}</b>}</span>
        {mobileOpen ? <FiChevronUp size={16} aria-hidden="true" /> : <FiChevronDown size={16} aria-hidden="true" />}
      </button>

      <div id={panelId} className="v2-fp__panel" data-open={mobileOpen ? "true" : "false"}>
        <div className="v2-fp__top">
          <h2>Filters</h2>
          <Link href={shopHref({})} className={activeCount ? "" : "is-idle"}>Clear All</Link>
        </div>

        {activeCount > 0 && (
          <ul className="v2-fp__chips" aria-label="Applied filters">
            {chips.map((chip) => (
              <li key={chip.key}>
                <Link href={shopHref(chip.next)} scroll={false} aria-label={`Remove filter ${chip.label}`}>{chip.label}<FiX size={13} aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        )}

        {/* 1. Category tree: the list scrolls inside its own box, so a long tree never makes the whole sidebar long */}
        {groupingMode === "category" ? (
          <Accordion title="Categories" defaultOpen active={Boolean(f.category)}>
            <div className="v2-fp__scroll">
              {availableCategories(departments).flatMap((root) => {
                const renderTree = (nodes, depth = 0) => nodes.flatMap((category) => {
                  const isActive = f.category === category.key;
                  return [
                    <Link key={category.key} href={shopHref({ ...f, category: isActive ? "" : category.key, gender: "" })} scroll={false}
                      className={`v2-fp__cat${isActive ? " is-on" : ""}`} style={{ paddingLeft: `${depth * 14}px` }}>
                      {cats.names[category.key] || category.name}
                    </Link>,
                    ...renderTree(category.subs, depth + 1),
                  ];
                });
                const isActive = f.category === root.key;
                return [
                  <Link key={root.key} href={shopHref({ ...f, category: isActive ? "" : root.key, gender: "" })} scroll={false}
                    className={`v2-fp__row${isActive ? " is-on" : ""}`}>
                    {check(isActive)}<span className="v2-fp__grow">{root.name}</span>
                  </Link>,
                  ...renderTree(root.subs, 1),
                ];
              })}
            </div>
          </Accordion>
        ) : (
          <Accordion title="Categories" defaultOpen active={Boolean(f.gender || f.category)}>
            <div className="v2-fp__scroll">
              {V2_GENDERS.filter((g) => !departments.length || findDepartment(g.key)).map((g) => {
              const isGenderActive = f.gender === g.key;
              const department = findDepartment(g.key);
              const renderCategories = (nodes, depth = 0) => nodes.flatMap((category) => {
                const isCatActive = f.category === category.key;
                return [
                  <Link key={category.key} href={shopHref({ ...f, category: isCatActive ? "" : category.key })} scroll={false}
                    className={`v2-fp__cat${isCatActive ? " is-on" : ""}`} style={{ paddingLeft: `${depth * 14}px` }}>
                    {cats.names[category.key] || category.name}
                  </Link>,
                  ...renderCategories(category.subs, depth + 1),
                ];
              });
              const categoryTreeItems = availableCategories(department?.subs);
              return (
                <div key={g.key} className="v2-fp__group">
                  <Link href={shopHref({ ...f, gender: isGenderActive ? "" : g.key, category: "" })} scroll={false} className={`v2-fp__row${isGenderActive ? " is-on" : ""}`}>
                    {check(isGenderActive)}
                    <span>{cats.genders[g.key]}</span>
                  </Link>
                  {isGenderActive && categoryTreeItems.length > 0 && <div className="v2-fp__sub">{renderCategories(categoryTreeItems)}</div>}
                </div>
              );
              })}
            </div>
          </Accordion>
        )}

        {/* 2. Brands: one brand at a time; click again to clear */}
        {brands.length > 0 && (
          <Accordion title={brandsTitle} defaultOpen={brands.length <= 6} active={Boolean(f.brand)}>
            <div className="v2-fp__scroll">
              {brands.map((brand) => {
                const isActive = f.brand === brand.id;
                return (
                  <Link key={brand.id} href={shopHref({ ...f, brand: isActive ? "" : brand.id })} scroll={false} className={`v2-fp__row${isActive ? " is-on" : ""}`}>
                    {check(isActive)}
                    <span className="v2-fp__grow">{brand.name}</span>
                    <span className="v2-fp__count">{brand.productCount}</span>
                  </Link>
                );
              })}
            </div>
          </Accordion>
        )}

        {/* 3. Price range */}
        <Accordion title="Price" defaultOpen active={Boolean(f.price)}>
          <div className="v2-fp__price">
            <div><span>৳0</span><span>Up to ৳{priceVal}</span></div>
            <input type="range" min="0" max={PRICE_MAX} step="50" value={priceVal} aria-label="Maximum price"
              onChange={(e) => setPriceVal(Number(e.target.value))}
              onPointerUp={(e) => applyPrice(e.currentTarget.value)}
              onKeyUp={(e) => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key)) applyPrice(e.currentTarget.value); }} />
          </div>
        </Accordion>

        {/* 4. Colour + size sit in one compact row group; availability stays folded unless used */}
        <Accordion title="Color" defaultOpen active={Boolean(f.color)}>
          <div className="v2-fp__swatches">
            {COLORS.map((c) => {
              const isActive = f.color === c.key;
              return (
                <Link key={c.key} href={shopHref({ ...f, color: isActive ? "" : c.key })} scroll={false} title={c.text} aria-label={c.text} aria-pressed={isActive}
                  className={`v2-fp__swatch${isActive ? " is-on" : ""}`} style={{ background: c.hex }} />
              );
            })}
          </div>
        </Accordion>

        <Accordion title="Size" defaultOpen active={Boolean(f.size)}>
          <div className="v2-fp__sizes">
            {SIZES.map((s) => {
              const key = s.toLowerCase();
              const isActive = f.size === key;
              return <Link key={key} href={shopHref({ ...f, size: isActive ? "" : key })} scroll={false} className={`v2-fp__size${isActive ? " is-on" : ""}`}>{s}</Link>;
            })}
          </div>
        </Accordion>

        <Accordion title="Availability" defaultOpen={false} active={Boolean(f.availability)}>
          {AVAILABILITY.map((a) => {
            const isActive = f.availability === a.key;
            return (
              <Link key={a.key} href={shopHref({ ...f, availability: isActive ? "" : a.key })} scroll={false} className={`v2-fp__row${isActive ? " is-on" : ""}`}>
                {check(isActive, true)}
                <span>{a.text}</span>
              </Link>
            );
          })}
        </Accordion>

        {/* Phones: close the panel and look at the products */}
        <button type="button" className="v2-fp__apply" onClick={() => setMobileOpen(false)}>
          {typeof resultCount === "number" ? `Show ${resultCount} ${resultCount === 1 ? "product" : "products"}` : "Show products"}
        </button>
      </div>
    </div>
  );
}
