"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { V2_CATEGORIES, V2_GENDERS } from "@/data/v2";
import { shopHref } from "@/lib/v2/filters";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

function Accordion({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--v2-line)', padding: '18px 0' }}>
      <button 
        type="button" onClick={() => setOpen(!open)} 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'var(--v2-ink)', padding: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}
      >
        {title}
        {open ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
      </button>
      {open && <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>}
    </div>
  );
}

export default function V2ShopFilters({ cats, f }) {
  const router = useRouter();
  
  // Price Slider State
  const currentMax = f.price ? Number(f.price) : 5000;
  const [priceVal, setPriceVal] = useState(currentMax);

  useEffect(() => {
    setPriceVal(f.price ? Number(f.price) : 5000);
  }, [f.price]);

  const applyPrice = (val) => {
    const url = shopHref({ ...f, price: val < 5000 ? val.toString() : "" });
    router.push(url, { scroll: false });
  };

  return (
    <div style={{ width: '100%', maxWidth: '280px', paddingRight: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--v2-ink)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Filters</h2>
        <Link href={shopHref({})} style={{ fontSize: '13px', color: 'var(--v2-muted)', textDecoration: 'underline' }}>Clear All</Link>
      </div>

      {/* 1. Category Tree */}
      <Accordion title="Categories" defaultOpen={true}>
         {V2_GENDERS.map((g) => {
           const isGenderActive = f.gender === g.key;
           return (
             <div key={g.key}>
               <Link 
                 href={shopHref({ ...f, gender: isGenderActive ? "" : g.key, category: "" })} 
                 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14.5px', fontWeight: isGenderActive ? '600' : '400', color: isGenderActive ? 'var(--v2-ink)' : 'var(--v2-muted)' }}
               >
                 <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '1px solid', borderColor: isGenderActive ? 'var(--v2-ink)' : 'var(--v2-line)', borderRadius: '3px', position: 'relative' }}>
                   {isGenderActive && <span style={{ position: 'absolute', top: '2px', left: '2px', width: '10px', height: '10px', background: 'var(--v2-ink)', borderRadius: '1px' }} />}
                 </span>
                 {cats.genders[g.key]}
               </Link>
               
               {isGenderActive && (
                 <div style={{ paddingLeft: '24px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '1px dashed var(--v2-line)', marginLeft: '7px' }}>
                   {V2_CATEGORIES.map((c) => {
                     const isCatActive = f.category === c.key;
                     return (
                       <Link 
                         key={c.key} href={shopHref({ ...f, category: isCatActive ? "" : c.key })}
                         style={{ fontSize: '13.5px', color: isCatActive ? 'var(--v2-ink)' : 'var(--v2-muted)', fontWeight: isCatActive ? '500' : '400', display: 'flex', alignItems: 'center' }}
                       >
                         {cats.names[c.key]}
                       </Link>
                     )
                   })}
                 </div>
               )}
             </div>
           )
         })}
      </Accordion>

      {/* 2. Availability */}
      <Accordion title="Availability" defaultOpen={false}>
        {[ { key: "in-stock", text: "In Stock" }, { key: "out-of-stock", text: "Out of Stock" } ].map(a => {
          const isActive = f.availability === a.key;
          return (
            <Link key={a.key} href={shopHref({ ...f, availability: isActive ? "" : a.key })} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14.5px', color: isActive ? 'var(--v2-ink)' : 'var(--v2-muted)' }}>
              <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '18px', height: '18px', border: '1px solid', borderColor: isActive ? 'var(--v2-ink)' : 'var(--v2-line)', borderRadius: '50%' }}>
                {isActive && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--v2-ink)' }} />}
              </span>
              {a.text}
            </Link>
          )
        })}
      </Accordion>

      {/* 3. Price Filter - NOW A RANGE SLIDER BAR */}
      <Accordion title="Price" defaultOpen={true}>
        <div style={{ padding: '5px 0 10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '15px', color: 'var(--v2-ink)', fontWeight: '500' }}>
            <span>৳0</span>
            <span>Up to ৳{priceVal}</span>
          </div>
          <input 
            type="range" 
            min="0" max="5000" step="50" 
            value={priceVal} 
            onChange={(e) => setPriceVal(e.target.value)}
            onMouseUp={(e) => applyPrice(e.target.value)}
            onTouchEnd={(e) => applyPrice(e.target.value)}
            style={{ 
              width: '100%', cursor: 'pointer', accentColor: 'var(--v2-ink)',
              height: '4px', background: 'var(--v2-line)', borderRadius: '2px', outline: 'none'
            }}
          />
        </div>
      </Accordion>

      {/* 4. Color Swatches */}
      <Accordion title="Color" defaultOpen={true}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[ { key: "black", hex: "#000000" }, { key: "white", hex: "#ffffff" }, { key: "blue", hex: "#4682b4" }, { key: "brown", hex: "#654321" }, { key: "red", hex: "#d94c4c" } ].map(c => {
            const isActive = f.color === c.key;
            return (
               <Link key={c.key} href={shopHref({ ...f, color: isActive ? "" : c.key })} title={c.text} style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: c.hex, border: isActive ? '2px solid var(--v2-ink)' : '1px solid var(--v2-line)', boxShadow: isActive ? '0 0 0 2px var(--v2-card) inset' : 'none', transition: '0.2s'
               }} />
            )
          })}
        </div>
      </Accordion>

      {/* 5. Size Pills */}
      <Accordion title="Size" defaultOpen={true}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {["S", "M", "L", "XL"].map(s => {
            const key = s.toLowerCase();
            const isActive = f.size === key;
            return (
              <Link key={key} href={shopHref({ ...f, size: isActive ? "" : key })} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '42px', height: '42px', borderRadius: '4px', border: isActive ? '1px solid var(--v2-ink)' : '1px solid var(--v2-line)', background: isActive ? 'var(--v2-ink)' : 'transparent', color: isActive ? 'var(--v2-card)' : 'var(--v2-ink)', fontSize: '13px', fontWeight: '500', transition: '0.2s'
              }}>
                {s}
              </Link>
            )
          })}
        </div>
      </Accordion>

    </div>
  );
}