"use client";

import { useState } from "react";

// Frontend only — no endpoint yet (API comes after the frontend is finished).
export default function V2Newsletter({ copy }) {
  const [state, setState] = useState("idle");
  const onSubmit = (e) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("email")?.toString().trim() ?? "";
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setState(valid ? "ok" : "error");
    if (valid) e.currentTarget.reset();
  };
  return (
    <section className="v2-news-band v2-block-pad">
      <div className="v2-wrap v2-news v2-reveal">
        <h2 className="v2-display v2-h2">{copy.title}</h2>
        <p className="v2-lede">{copy.text}</p>
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="v2-email" className="sr-only">{copy.label}</label>
          <input id="v2-email" name="email" type="email" autoComplete="email" placeholder={copy.placeholder} aria-describedby="v2-news-msg" aria-invalid={state === "error"} />
          <button type="submit" className="v2-pill v2-pill--solid">{copy.button}</button>
        </form>
        <p id="v2-news-msg" className="v2-news__msg" data-state={state} role="status">{state === "ok" ? copy.ok : state === "error" ? copy.bad : ""}</p>
      </div>
    </section>
  );
}
