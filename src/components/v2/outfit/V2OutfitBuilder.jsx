"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiShuffle, FiBookmark, FiLink, FiX, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { LOOK_COPY, SLOTS, GENDERS, MAX_SAVED, slotOf, loadLooks, storeLooks, postLook, shareUrl, parseShare } from "@/lib/v2/looks";

// Client-safe photo box (V2Media is server-only: it checks local files with node:fs). Remote catalog photos only.
function Photo({ src, alt, sizes, className, children }) {
  return (
    <div className={`v2-media ${className || ""}`} {...(src ? {} : { role: "img", "aria-label": alt })}>
      {src && <RemoteImage src={src} alt={alt} sizes={sizes} />}
      {children}
    </div>
  );
}

const blank = () => ({ top: "", bottom: "", layer: "" });

// Pick a top, bottoms and a layer; add the whole outfit to the cart at once. Looks can be saved (this device) or shared by link.
export default function V2OutfitBuilder() {
  const { lang, catalog, fmt, num, sizeLabel, recommendFor, addOutfit, showToast, hydrated } = useV2Store();
  const t = LOOK_COPY[lang] || LOOK_COPY.en;
  const [gender, setGender] = useState("men");
  const [picks, setPicks] = useState({ top: null, bottom: null, layer: null });
  const [sizes, setSizes] = useState(blank());
  const [colors, setColors] = useState(blank());
  const [missing, setMissing] = useState([]);
  const [looks, setLooks] = useState([]);

  const byId = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  const options = useMemo(() => Object.fromEntries(SLOTS.map((s) => [s, catalog.filter((p) => slotOf(p.category) === s && p.genders.includes(gender))])), [catalog, gender]);

  useEffect(() => {
    setLooks(loadLooks());
    const shared = parseShare(window.location.search, catalog);
    if (shared) { if (shared.gender) setGender(shared.gender); setPicks((p) => ({ ...p, ...shared.picks })); }
  }, [catalog]);

  const chosen = SLOTS.map((s) => ({ slot: s, p: picks[s] ? byId.get(picks[s]) : null }));
  const sizeFor = (slot, p) => sizes[slot] || recommendFor(p) || (p.sizes?.length === 1 ? p.sizes[0] : "");
  const colorFor = (slot, p) => colors[slot] || p.colors?.[0]?.name || "";
  const items = chosen.filter((c) => c.p);
  const total = items.reduce((a, c) => a + (c.p.price || 0), 0);

  const pick = (slot, p) => {
    setPicks((x) => ({ ...x, [slot]: x[slot] === p.id ? null : p.id }));
    setSizes((x) => ({ ...x, [slot]: "" })); setColors((x) => ({ ...x, [slot]: "" }));
    setMissing((m) => m.filter((s) => s !== slot));
  };
  const changeGender = (g) => { setGender(g); setPicks({ top: null, bottom: null, layer: null }); setSizes(blank()); setColors(blank()); setMissing([]); };
  const shuffle = () => {
    const next = {};
    SLOTS.forEach((s) => { const list = options[s].filter((p) => p.stock !== 0); next[s] = list.length ? list[Math.floor(Math.random() * list.length)].id : null; });
    setPicks(next); setSizes(blank()); setColors(blank()); setMissing([]);
  };

  const addAll = () => {
    const lacking = items.filter((c) => !sizeFor(c.slot, c.p)).map((c) => c.slot);
    setMissing(lacking);
    if (lacking.length) return;
    addOutfit(items.map((c) => ({ product: c.p, size: sizeFor(c.slot, c.p), color: colorFor(c.slot, c.p) })), t.added.replace("{n}", items.length));
  };

  const save = () => {
    if (looks.length >= MAX_SAVED) return showToast?.(t.limit.replace("{n}", MAX_SAVED), "error");
    const look = {
      id: Date.now(), gender, picks: { ...picks },
      sizes: Object.fromEntries(items.map((c) => [c.slot, sizeFor(c.slot, c.p)])),
      colors: Object.fromEntries(items.map((c) => [c.slot, colorFor(c.slot, c.p)])),
    };
    const next = [look, ...looks]; setLooks(next); storeLooks(next); postLook(look); showToast?.(t.saved, "success");
  };
  const load = (l) => { setGender(l.gender); setPicks({ top: null, bottom: null, layer: null, ...l.picks }); setSizes({ ...blank(), ...l.sizes }); setColors({ ...blank(), ...l.colors }); setMissing([]); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const del = (id) => { const next = looks.filter((l) => l.id !== id); setLooks(next); storeLooks(next); };
  const share = async () => {
    const url = shareUrl(window.location.origin, gender, picks);
    try { await navigator.clipboard.writeText(url); showToast?.(t.copied, "success"); } catch { window.prompt(t.share, url); }
  };

  return (
    <div className="v2-wrap v2-page v2-ob">
      <p className="v2-ob__lead">{t.lead}</p>
      <div className="v2-ob__who" role="group" aria-label={t.forWho}>
        <span>{t.forWho}</span>
        {GENDERS.map((g) => <button key={g} type="button" className="v2-chip" aria-pressed={gender === g} onClick={() => changeGender(g)}>{t.genders[g]}</button>)}
      </div>

      <div className="v2-ob__grid">
        <div className="v2-ob__slots">
          {SLOTS.map((slot) => (
            <section key={slot} className="v2-ob__slot" aria-labelledby={`ob-${slot}`}>
              <h2 id={`ob-${slot}`} className="v2-ip__h">{t.slots[slot]}</h2>
              {options[slot].length === 0 ? <p className="v2-ob__none">{t.none}</p> : (
                <ul className="v2-ob__rail">
                  {options[slot].map((p) => {
                    const on = picks[slot] === p.id; const out = p.stock === 0;
                    return (
                      <li key={p.id}>
                        <button type="button" className="v2-ob__card" aria-pressed={on} disabled={out} onClick={() => pick(slot, p)}>
                          <Photo src={p.image} alt="" sizes="160px" className="v2-ob__img">{on && <span className="v2-ob__tick" aria-hidden="true"><FiCheck /></span>}</Photo>
                          <span className="v2-ob__name">{p.name}</span>
                          <span className="v2-ob__price">{out ? t.outOfStock : fmt(p.price)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>

        <aside className="v2-ob__sum" aria-labelledby="ob-sum">
          <div className="v2-ob__sumhead">
            <h2 id="ob-sum" className="v2-acc__h">{t.yourLook}</h2>
            <button type="button" className="v2-ob__ghost" onClick={shuffle}><FiShuffle aria-hidden="true" />{t.shuffle}</button>
          </div>
          <ul className="v2-ob__lines">
            {chosen.map(({ slot, p }) => (
              <li key={slot} className={`v2-ob__line${p ? "" : " is-empty"}`}>
                {p ? (
                  <>
                    <Photo src={p.image} alt="" sizes="64px" className="v2-ob__thumb" />
                    <div className="v2-ob__info">
                      <p className="v2-ob__lineHead"><small>{t.slots[slot]}</small><button type="button" aria-label={`${t.remove} ${p.name}`} onClick={() => pick(slot, p)}><FiX aria-hidden="true" /></button></p>
                      <p className="v2-ob__linename">{p.name} <b>{fmt(p.price)}</b></p>
                      {p.sizes?.length > 0 && (
                        <div className="v2-ob__sizes" role="radiogroup" aria-label={t.size} data-invalid={missing.includes(slot) ? "true" : undefined}>
                          {p.sizes.map((s) => (
                            <button key={s} type="button" role="radio" aria-checked={sizeFor(slot, p) === s} className={`v2-ob__size${s === recommendFor(p) ? " is-rec" : ""}`}
                              onClick={() => { setSizes((x) => ({ ...x, [slot]: s })); setMissing((m) => m.filter((k) => k !== slot)); }}>{sizeLabel(s)}</button>
                          ))}
                        </div>
                      )}
                      {missing.includes(slot) && <p className="v2-field-error" role="alert">{t.pickSize}</p>}
                      {p.colors?.length > 1 && (
                        <select aria-label={t.color} className="v2-ob__color" value={colorFor(slot, p)} onChange={(e) => setColors((x) => ({ ...x, [slot]: e.target.value }))}>
                          {p.colors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      )}
                    </div>
                  </>
                ) : <p>{t.choose.replace("{slot}", t.slots[slot].toLowerCase())}</p>}
              </li>
            ))}
          </ul>
          {missing.length > 0 && <p className="v2-field-error" role="alert">{t.sizeError}</p>}
          <div className="v2-ob__total"><span>{t.total} <small>· {t.pieces.replace("{n}", num(items.length))}</small></span><b>{fmt(total)}</b></div>
          <button type="button" className="v2-pill v2-pill--solid v2-ob__add" disabled={!items.length} onClick={addAll}><FiShoppingBag aria-hidden="true" />{t.add}</button>
          {!items.length && <p className="v2-ob__none">{t.empty}</p>}
          <div className="v2-ob__acts">
            <button type="button" className="v2-pill v2-pill--outline v2-pill--sm" disabled={!items.length || !hydrated} onClick={save}><FiBookmark aria-hidden="true" />{t.save}</button>
            <button type="button" className="v2-pill v2-pill--outline v2-pill--sm" disabled={!items.length} onClick={share}><FiLink aria-hidden="true" />{t.share}</button>
          </div>
        </aside>
      </div>

      {looks.length > 0 && (
        <section className="v2-ob__saved" aria-labelledby="ob-saved">
          <h2 id="ob-saved" className="v2-ip__h">{t.savedTitle}</h2>
          <ul>
            {looks.map((l) => {
              const ps = SLOTS.map((s) => (l.picks[s] ? byId.get(l.picks[s]) : null)).filter(Boolean);
              return (
                <li key={l.id}>
                  <div className="v2-ob__strip">{ps.map((p) => <Photo key={p.id} src={p.image} alt={p.name} sizes="80px" className="v2-ob__mini" />)}</div>
                  <p><b>{fmt(ps.reduce((a, p) => a + p.price, 0))}</b> <small>· {t.genders[l.gender]} · {t.pieces.replace("{n}", num(ps.length))}</small></p>
                  <div className="v2-ob__savedbtns">
                    <button type="button" className="v2-pill v2-pill--outline v2-pill--sm" onClick={() => load(l)}>{t.load}</button>
                    <button type="button" className="v2-ob__ghost" aria-label={t.delete} onClick={() => del(l.id)}><FiTrash2 aria-hidden="true" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
