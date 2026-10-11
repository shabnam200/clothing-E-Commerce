"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiCheckCircle, FiThumbsUp } from "react-icons/fi";
import V2Stars from "@/components/v2/reviews/V2Stars";
import V2ReviewForm from "@/components/v2/reviews/V2ReviewForm";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { fmtRating } from "@/lib/v2/format";
import { api } from "@/services";
import "@/styles/v2-reviews.css";

const PAGE_SIZE = 5;
const SORTS = ["helpful", "newest", "highest", "lowest"];
const ISO = /^\d{4}-\d{2}-\d{2}T/;

// Reviews of one product: rating summary, write a review, sort, "helpful" votes, delete your own review.
// onSummary({ average, count }) lets the product page keep the rating under the title up to date.
export default function V2Reviews({ productId, copy: c, baseRating, baseCount, onSummary }) {
  const { isLoggedIn, user, setAuthModalOpen, showToast, lang, num, fill } = useV2Store();
  const [state, setState] = useState({ status: "loading", items: [], meta: null, summary: null });
  const [sort, setSort] = useState("helpful");
  const [formOpen, setFormOpen] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const latest = useRef(0);
  const pending = useRef(new Set());
  const summaryCb = useRef(onSummary);
  summaryCb.current = onSummary;

  const load = useCallback(async (page = 1) => {
    const mine = ++latest.current;
    if (page === 1) setState((s) => (s.status === "ready" ? s : { ...s, status: "loading" }));
    try {
      const r = await api.catalog.reviews(productId, { page, limit: PAGE_SIZE, sort, lang });
      if (mine !== latest.current) return;
      setState((s) => ({
        status: "ready", meta: r.meta, summary: r.summary,
        items: page === 1 ? r.items : [...s.items, ...r.items.filter((x) => !s.items.some((y) => y.id === x.id))],
      }));
      if (r.summary) summaryCb.current?.(r.summary);
    } catch { if (mine === latest.current) setState((s) => ({ ...s, status: s.items.length ? "ready" : "error" })); }
  }, [productId, sort, lang]);

  // (re)load when the sort changes or the customer signs in / out (so "voted" and "your review" are right)
  useEffect(() => { load(1); }, [load, isLoggedIn, user?.id]);

  const patch = (id, changes) => setState((s) => ({ ...s, items: s.items.map((r) => (r.id === id ? { ...r, ...changes } : r)) }));

  const vote = async (r) => {
    if (!isLoggedIn) { setAuthModalOpen(true); return; }
    if (r.mine || pending.current.has(r.id)) return;
    pending.current.add(r.id);
    const next = !r.voted;
    patch(r.id, { voted: next, helpful: Math.max(0, r.helpful + (next ? 1 : -1)) }); // optimistic: feels instant
    try {
      const res = await api.reviews.vote(r.id, { helpful: next });
      patch(r.id, { voted: res.voted, helpful: res.helpful });
    } catch {
      patch(r.id, { voted: r.voted, helpful: r.helpful });
      showToast(c.voteFail, "error");
    } finally { pending.current.delete(r.id); }
  };

  const remove = async (r) => {
    try { await api.reviews.remove(r.id); setConfirmId(null); showToast(c.deleted, "success"); await load(1); }
    catch (e) { showToast(e?.message || c.error, "error"); }
  };

  const writeClick = () => { if (!isLoggedIn) { setAuthModalOpen(true); return; } setFormOpen(true); };
  const fmtDate = (d) => {
    if (!ISO.test(String(d))) return d; // demo reviews already carry a ready-made date text
    const x = new Date(d);
    return Number.isNaN(+x) ? "" : x.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const { status, items, meta, summary } = state;
  const avg = summary?.average ?? baseRating;
  const count = summary?.count ?? baseCount;
  const hasMine = items.some((r) => r.mine);

  return (
    <section className="v2-rv" aria-label={c.title}>
      <header className="v2-rv__top">
        <div className="v2-rv__score">
          <p className="v2-rv__avg">{fmtRating(avg, lang)}<small>{c.outOf}</small></p>
          <div className="v2-rv__scoremeta">
            <V2Stars value={avg} />
            <span>{fill(c.based, { n: num(count) })}</span>
          </div>
        </div>
        {!hasMine && !formOpen && <button type="button" className="v2-pill v2-pill--solid" onClick={writeClick}>{c.write}</button>}
      </header>

      {formOpen && !hasMine && (
        <V2ReviewForm productId={productId} copy={c} onCancel={() => setFormOpen(false)} onDone={() => { setFormOpen(false); load(1); }} />
      )}

      <div className="v2-rv__bar">
        <label className="v2-rv__sort">{c.sortLabel}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((k) => <option key={k} value={k}>{c.sort[k]}</option>)}
          </select>
        </label>
        {meta && meta.total > 0 && <span className="v2-rv__shown" aria-live="polite">{fill(fill(c.shown, { a: num(items.length) }), { b: num(meta.total) })}</span>}
      </div>

      {status === "loading" && (
        <div role="status" aria-label={c.loading}>
          {[0, 1, 2].map((k) => <div className="v2-rv__skeleton" key={k}><i /><i /><i /></div>)}
        </div>
      )}
      {status === "error" && (
        <div className="v2-rv__state">
          <p>{c.error}</p>
          <button type="button" className="v2-pill v2-pill--outline" onClick={() => load(1)}>{c.retry}</button>
        </div>
      )}
      {status === "ready" && items.length === 0 && <p className="v2-rv__state">{c.empty}</p>}

      {status === "ready" && items.length > 0 && (
        <ul className="v2-rv__list">
          {items.map((r) => (
            <li key={r.id} className="v2-rv__item" data-mine={r.mine ? "true" : undefined}>
              <div className="v2-rv__head">
                <V2Stars value={r.rating} />
                <span className="sr-only">{num(r.rating)} / {num(5)}</span>
                <strong>{r.name}</strong>
                {r.mine && <span className="v2-rv__badge v2-rv__badge--you">{c.yours}</span>}
                {r.verified && <span className="v2-rv__badge"><FiCheckCircle aria-hidden="true" />{c.verified}</span>}
                <span className="v2-rv__date">{fmtDate(r.date)}</span>
              </div>
              {r.title && <h4>{r.title}</h4>}
              <p>{r.text}</p>
              <div className="v2-rv__foot">
                {!r.mine && <span className="v2-rv__q">{c.helpfulQ}</span>}
                {(!r.mine || r.helpful > 0) && (
                  <button type="button" className="v2-rv__vote" aria-pressed={r.voted} disabled={r.mine}
                    title={r.mine ? c.ownVote : r.voted ? c.voteOn : undefined} onClick={() => vote(r)}>
                    <FiThumbsUp aria-hidden="true" /> {c.helpful}{r.helpful > 0 ? ` (${num(r.helpful)})` : ""}
                  </button>
                )}
                {r.mine && (confirmId === r.id ? (
                  <span className="v2-rv__ask" role="group" aria-label={c.deleteAsk}>
                    {c.deleteAsk}
                    <button type="button" className="v2-rv__link v2-rv__link--danger" onClick={() => remove(r)}>{c.deleteYes}</button>
                    <button type="button" className="v2-rv__link" onClick={() => setConfirmId(null)}>{c.deleteNo}</button>
                  </span>
                ) : (
                  <button type="button" className="v2-rv__link v2-rv__link--danger" onClick={() => setConfirmId(r.id)}>{c.delete}</button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.page < meta.last_page && (
        <button type="button" className="v2-pill v2-pill--outline v2-rv__more" disabled={moreBusy}
          onClick={async () => { setMoreBusy(true); await load(meta.page + 1); setMoreBusy(false); }}>{c.more}</button>
      )}
    </section>
  );
}
