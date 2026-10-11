"use client";

import { useEffect, useRef, useState } from "react";
import { FiStar } from "react-icons/fi";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { api } from "@/services";

const MAX = 1000;
const MIN = 10;

// "Write a review" form: star rating (keyboard friendly radio group), optional title, review text. Posts through api.reviews.create().
export default function V2ReviewForm({ productId, copy: c, onDone, onCancel }) {
  const { showToast, num, fill } = useV2Store();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const box = useRef(null);

  useEffect(() => { box.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); box.current?.querySelector("input")?.focus({ preventScroll: true }); }, []);

  const shown = hover || rating;
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const next = {};
    if (!rating) next.rating = c.errRating;
    if (text.trim().length < MIN) next.text = c.errText;
    setErr(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await api.reviews.create(productId, { rating, title: title.trim(), text: text.trim() });
      showToast(c.thanks, "success");
      onDone();
    } catch (ex) {
      const f = ex?.errors || {};
      setErr({ rating: f.rating?.[0], text: f.text?.[0], title: f.title?.[0], form: f.review?.[0] || (Object.keys(f).length ? "" : ex?.message) });
    } finally { setBusy(false); }
  };

  return (
    <form ref={box} className="v2-rf" onSubmit={submit} noValidate aria-label={c.formTitle}>
      <h3>{c.formTitle}</h3>
      {err.form && <p className="v2-auth__alert" role="alert">{err.form}</p>}

      <fieldset>
        <legend>{c.ratingLabel}</legend>
        <div className="v2-rf__starrow" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="v2-rf__star" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rv-rating" value={n} checked={rating === n} aria-label={`${num(n)} / ${num(5)} \u2013 ${c.ratingHint[n - 1]}`} onChange={() => { setRating(n); setErr((x) => ({ ...x, rating: "" })); }} />
              <FiStar aria-hidden="true" fill={n <= shown ? "currentColor" : "none"} />
            </label>
          ))}
          <span className="v2-rf__hint" aria-live="polite">{shown ? c.ratingHint[shown - 1] : ""}</span>
        </div>
        {err.rating && <p className="v2-field-error" role="alert">{err.rating}</p>}
      </fieldset>

      <div className="v2-field">
        <label htmlFor="rv-title">{c.titleLabel}</label>
        <input id="rv-title" type="text" maxLength={80} value={title} placeholder={c.titlePh} onChange={(e) => setTitle(e.target.value)} />
        {err.title && <p className="v2-field-error" role="alert">{err.title}</p>}
      </div>

      <div className="v2-field">
        <label htmlFor="rv-text">{c.textLabel}</label>
        <textarea id="rv-text" rows={5} maxLength={MAX} value={text} placeholder={c.textPh} aria-invalid={!!err.text}
          onChange={(e) => { setText(e.target.value); if (err.text) setErr((x) => ({ ...x, text: "" })); }} />
        <div className="v2-rf__row">
          {err.text ? <p className="v2-field-error" role="alert">{err.text}</p> : <span />}
          <span>{fill(c.count, { n: num(text.length) })}</span>
        </div>
      </div>

      <div className="v2-rf__acts">
        <button type="submit" className="v2-pill v2-pill--solid" disabled={busy}>{busy ? c.working : c.submit}</button>
        <button type="button" className="v2-pill v2-pill--outline" onClick={onCancel}>{c.close}</button>
      </div>
    </form>
  );
}
