"use client";

import { useEffect, useState } from "react";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { FiBookOpen, FiChevronUp } from "react-icons/fi";
import { SIZE_COPY, SIZE_CHART, EMPTY_PASSPORT, PASSPORT_RANGES, cleanPassport, hasPassport, passportError, recommendSize } from "@/lib/v2/size";

const TOPS = { sizes: ["S", "M", "L", "XL"] };
const JEANS = { sizes: ["28", "30", "32", "34"] };
const KIDS = { sizes: ["4Y", "6Y", "8Y", "10Y"] };

// Profile > Size passport: measurements saved on this device (localStorage via the store).
export default function V2SizePassport() {
  const { lang, sizeProfile, saveSizeProfile, clearSizeProfile, showToast } = useV2Store();
  const t = SIZE_COPY[lang] || SIZE_COPY.en;
  const [draft, setDraft] = useState({ ...EMPTY_PASSPORT, ...sizeProfile });
  const [err, setErr] = useState("");
  const [guide, setGuide] = useState(false);
  const [picked, setPicked] = useState(null);
  const [note, setNote] = useState("");
  useEffect(() => { setDraft({ ...EMPTY_PASSPORT, ...sizeProfile }); }, [sizeProfile]);

  const set = (k) => (e) => { setDraft((d) => ({ ...d, [k]: e.target.value })); setErr(""); setPicked(null); setNote(""); };
  const UNITS = { height: "cm", weight: "kg", chest: "cm", waist: "cm", age: "yrs" };
  const bad = Object.keys(PASSPORT_RANGES).filter((k) => String(draft[k] ?? "").trim() !== "" && !cleanPassport(draft)[k]);
  const badText = bad.map((k) => `${t.names[k]} ${PASSPORT_RANGES[k][0]}–${PASSPORT_RANGES[k][1]} ${UNITS[k]}`).join(", ");
  const useRow = (key, row) => {
    setDraft((d) => ({ ...d, ...row.fill }));
    setPicked(key); setErr(""); setNote(t.filled.replace("{size}", row.size));
    setGuide(false);
    requestAnimationFrame(() => document.getElementById("sp-height")?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };
  const live = hasPassport(draft) && !passportError(draft);
  const tops = live ? recommendSize(draft, TOPS) : null;
  const jeans = live ? recommendSize(draft, JEANS) : null;
  const kids = live ? recommendSize(draft, KIDS) : null;

  const submit = (e) => {
    e.preventDefault();
    if (passportError(draft)) return setErr(`${t.range} ${t.check} ${badText}`);
    if (!draft.chest.trim() && !draft.weight.trim() && !String(draft.age ?? "").trim()) return setErr(t.needOne);
    saveSizeProfile(draft);
    showToast?.(t.saved, "success");
  };
  const clear = () => { clearSizeProfile(); setDraft({ ...EMPTY_PASSPORT }); setErr(""); setPicked(null); setNote(""); showToast?.(t.cleared); };

  return (
    <section className="v2-sp" aria-labelledby="sp-title">
      <div className="v2-acc__headrow">
        <h2 id="sp-title" className="v2-acc__h">{t.title}</h2>
        <button type="button" className="v2-pill v2-pill--outline v2-pill--sm" aria-expanded={guide} aria-controls="sp-guide" onClick={() => setGuide((g) => !g)}>
          {guide ? <FiChevronUp aria-hidden="true" /> : <FiBookOpen aria-hidden="true" />}{guide ? t.guideClose : t.guide}
        </button>
      </div>
      {guide && (
        <div id="sp-guide" className="v2-sp__guide">
          <p className="v2-sp__intro">{t.guideHint}</p>
          <div className="v2-sp__tablewrap">
            <p className="v2-sp__label">{t.tops}</p>
            <table className="v2-ip__table">
              <thead><tr><th scope="col">{t.cSize}</th><th scope="col">{t.cChest}</th><th scope="col">{t.cWeight}</th><th scope="col">{t.cHeight}</th><th scope="col"><span className="sr-only">{t.use}</span></th></tr></thead>
              <tbody>
                {SIZE_CHART.tops.map((r) => (
                  <tr key={r.size} className={picked === `t${r.size}` ? "is-picked" : undefined}>
                    <th scope="row">{r.size}</th><td>{r.chest}</td><td>{r.weight}</td><td>{r.height}</td>
                    <td><button type="button" className="v2-sp__use" onClick={() => useRow(`t${r.size}`, r)} aria-label={`${t.use} ${r.size}`}>{picked === `t${r.size}` ? t.using : t.use}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="v2-sp__tablewrap">
            <p className="v2-sp__label">{t.jeans}</p>
            <table className="v2-ip__table">
              <thead><tr><th scope="col">{t.cWaistIn}</th><th scope="col">{t.cWaist}</th><th scope="col"><span className="sr-only">{t.use}</span></th></tr></thead>
              <tbody>
                {SIZE_CHART.jeans.map((r) => (
                  <tr key={r.size} className={picked === `j${r.size}` ? "is-picked" : undefined}>
                    <th scope="row">{r.size}</th><td>{r.waist}</td>
                    <td><button type="button" className="v2-sp__use" onClick={() => useRow(`j${r.size}`, r)} aria-label={`${t.use} ${r.size}`}>{picked === `j${r.size}` ? t.using : t.use}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="v2-sp__note">{t.kidsNote}</p>
        </div>
      )}
      <form className="v2-card-form" onSubmit={submit} noValidate>
        <p className="v2-sp__intro">{t.intro}</p>
        <div className="v2-acc__grid2">
          {[["height", t.height], ["weight", t.weight], ["chest", t.chest], ["waist", t.waist], ["age", t.age]].map(([k, label]) => (
            <div className="v2-field" key={k} data-invalid={bad.includes(k) ? "true" : undefined}>
              <label htmlFor={`sp-${k}`}>{label}{(k === "waist" || k === "age") && <small> · {t.optional}</small>}</label>
              <input id={`sp-${k}`} type="number" inputMode="decimal" min="0" step={k === "age" ? "1" : "0.5"} value={draft[k]} onChange={set(k)} aria-invalid={bad.includes(k)} />
            </div>
          ))}
        </div>
        {note && <p className="v2-sp__filled" role="status">{note}</p>}
        {err && <p className="v2-field-error" role="alert">{err}</p>}
        <div className="v2-sp__result" aria-live="polite">
          <p className="v2-sp__label">{t.yourSizes}</p>
          {live ? (
            <ul>
              {tops && <li><span>{t.tops}</span><b>{tops}</b></li>}
              {jeans && <li><span>{t.jeans}</span><b>{jeans}</b></li>}
              {kids && <li><span>{t.kids}</span><b>{kids}</b></li>}
            </ul>
          ) : <p className="v2-sp__none">{t.none}</p>}
          <p className="v2-sp__note">{t.note}</p>
        </div>
        <div className="v2-acc__btns">
          <button type="submit" className="v2-pill v2-pill--solid">{t.save}</button>
          {hasPassport(sizeProfile) && <button type="button" className="v2-pill v2-pill--outline" onClick={clear}>{t.clear}</button>}
        </div>
      </form>
    </section>
  );
}
