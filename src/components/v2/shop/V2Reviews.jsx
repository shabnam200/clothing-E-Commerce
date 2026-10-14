"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCheckCircle, FiStar, FiThumbsUp } from "react-icons/fi";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { api } from "@/services";

const PAGE = 10;

function Stars({ value, label }) {
  const full = Math.round(value);
  return (
    <span className="v2-pd__stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => <FiStar key={n} aria-hidden="true" fill={n <= full ? "currentColor" : "none"} />)}
    </span>
  );
}

// Reviews tab: reads the reviews from the API, lets a logged-in customer write one (one per product) and mark others as helpful.
// Guests can read everything; writing or voting opens the login popup and carries on by itself after login.
export default function V2Reviews({ productId, copy: c }) {
  const { isLoggedIn, checkAuth, hydrated, lang, num, fill, showToast } = useV2Store();
  const [state, setState] = useState("loading"); // loading | ready | error
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ rating: 0, text: "" });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (p = 1) => {
    if (p === 1) setState("loading"); else setMore(true);
    try {
      const { items: rows, meta } = await api.catalog.reviews(productId, { page: p, limit: PAGE, lang });
      setItems((cur) => (p === 1 ? rows : [...cur, ...rows]));
      setPage(p); setLastPage(meta?.last_page ?? 1); setState("ready");
    } catch { if (p === 1) setState("error"); else showToast(c.reviewsError, "error"); }
    finally { setMore(false); }
  }, [productId, lang, c.reviewsError, showToast]);

  // (re)load after the session is known: a logged-in person also gets their own "helpful" marks back
  useEffect(() => { if (hydrated) load(1); }, [hydrated, isLoggedIn, load]);

  const fmtDate = (v) => { const d = new Date(v); return /^\d{4}-\d{2}-\d{2}/.test(String(v)) && !Number.isNaN(+d) ? d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : String(v || ""); };
  const hasMine = items.some((r) => r.mine);

  const startWriting = () => { if (checkAuth(() => setOpen(true))) setOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const er = {};
    if (!draft.rating) er.rating = c.errRating;
    if (draft.text.trim().length < 10) er.text = c.errText;
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const r = await api.reviews.create(productId, { rating: draft.rating, text: draft.text.trim() });
      setItems((cur) => [r, ...cur]);
      setOpen(false); setDraft({ rating: 0, text: "" });
      showToast(c.reviewThanks, "success");
    } catch (ex) {
      const fe = {};
      for (const k of ["rating", "text"]) { const m = ex?.field?.(k); if (m) fe[k] = m; }
      if (Object.keys(fe).length) setErrs(fe); else { showToast(ex?.message || c.reviewsError, "error"); if (/already/i.test(ex?.message || "")) { setOpen(false); load(1); } }
    } finally { setBusy(false); }
  };

  // "Helpful": the number changes straight away, the API call follows; a failure puts it back.
  const vote = (r) => {
    if (!checkAuth(() => vote(r))) return;
    const on = !r.helpful;
    const patch = (fn) => setItems((cur) => cur.map((x) => (x.id === r.id ? fn(x) : x)));
    patch((x) => ({ ...x, helpful: on, helpfulCount: Math.max(0, x.helpfulCount + (on ? 1 : -1)) }));
    api.reviews.setHelpful(r.id, on)
      .then((s) => patch((x) => ({ ...x, helpful: s.helpful, helpfulCount: s.helpfulCount })))
      .catch((ex) => { patch(() => r); showToast(ex?.message || c.reviewsError, "error"); });
  };

  return (
    <div className="v2-revs">
      <div className="v2-revs__bar">
        <h3>{c.reviewsTitle}</h3>
        {!open && !hasMine && (
          <button type="button" className="v2-pill v2-pill--outline v2-revs__write" onClick={startWriting}>
            {isLoggedIn ? c.writeReview : c.loginToReview}
          </button>
        )}
      </div>

      {open && (
        <form className="v2-revs__form" onSubmit={submit} noValidate aria-label={c.writeReview}>
          <fieldset className="v2-revs__rate">
            <legend>{c.yourRating}</legend>
            <div role="radiogroup" aria-label={c.yourRating}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={draft.rating === n} aria-label={fill(c.starsLabel, { n: num(n) })}
                  className="v2-revs__star" data-on={n <= draft.rating || undefined}
                  onClick={() => { setDraft((d) => ({ ...d, rating: n })); setErrs((x) => ({ ...x, rating: undefined })); }}>
                  <FiStar aria-hidden="true" fill={n <= draft.rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            {errs.rating && <p className="v2-field__err" role="alert">{errs.rating}</p>}
          </fieldset>
          <div className="v2-field" data-invalid={errs.text ? "true" : undefined}>
            <label htmlFor="rev-text">{c.yourReview}</label>
            <textarea id="rev-text" rows={4} maxLength={1000} value={draft.text} placeholder={c.reviewPlaceholder} aria-invalid={errs.text ? "true" : undefined}
              onChange={(e) => { setDraft((d) => ({ ...d, text: e.target.value })); setErrs((x) => ({ ...x, text: undefined })); }} />
            {errs.text ? <p className="v2-field__err" role="alert">{errs.text}</p> : <p className="v2-field__hint">{c.reviewMin}</p>}
          </div>
          <div className="v2-acc__btns">
            <button type="submit" className="v2-pill v2-pill--solid" disabled={busy} aria-busy={busy}>{busy ? c.submitting : c.submitReview}</button>
            <button type="button" className="v2-pill v2-pill--outline" onClick={() => { setOpen(false); setErrs({}); }}>{c.cancelReview}</button>
          </div>
        </form>
      )}

      {state === "loading" && <p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /> {c.loadingReviews}</p>}
      {state === "error" && (
        <div className="v2-revs__error" role="alert">
          <p>{c.reviewsError}</p>
          <button type="button" className="v2-pill v2-pill--outline" onClick={() => load(1)}>{c.retry}</button>
        </div>
      )}
      {state === "ready" && items.length === 0 && <p>{c.noReviews}</p>}
      {state === "ready" && items.length > 0 && (
        <ul className="v2-rev">
          {items.map((r) => (
            <li key={r.id}>
              <div className="v2-rev__head">
                <Stars value={r.rating} label={fill(c.starsLabel, { n: num(r.rating) })} />
                <strong>{r.name}</strong>
                {r.verified && <span className="v2-rev__badge"><FiCheckCircle aria-hidden="true" /> {c.verified}</span>}
                {r.mine && <span className="v2-rev__badge v2-rev__badge--mine">{c.yours}</span>}
                <span className="v2-rev__date">{fmtDate(r.date)}</span>
              </div>
              <p>{r.text}</p>
              {!r.mine && (
                <button type="button" className="v2-rev__helpful" aria-pressed={r.helpful} onClick={() => vote(r)}>
                  <FiThumbsUp aria-hidden="true" fill={r.helpful ? "currentColor" : "none"} /> {r.helpfulCount > 0 ? fill(c.helpfulN, { n: num(r.helpfulCount) }) : c.helpful}
                </button>
              )}
              {r.mine && r.helpfulCount > 0 && <span className="v2-rev__helpful v2-rev__helpful--static"><FiThumbsUp aria-hidden="true" /> {fill(c.helpfulN, { n: num(r.helpfulCount) })}</span>}
            </li>
          ))}
        </ul>
      )}
      {state === "ready" && page < lastPage && (
        <button type="button" className="v2-pill v2-pill--outline v2-revs__more" onClick={() => load(page + 1)} disabled={more}>{c.loadMore}</button>
      )}
    </div>
  );
}
