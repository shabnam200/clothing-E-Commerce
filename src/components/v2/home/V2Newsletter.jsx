"use client";

import { useState } from "react";

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
    <section 
      className="v2-news-band v2-block-pad" 
      style={{ 
        position: 'relative', 
        backgroundImage: 'url("https://images.unsplash.com/photo-1441984904996-e0b6ed29ae27?q=80&w=2000&auto=format&fit=crop")', // Fashion related background
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundAttachment: 'fixed', // Parallax effect
        color: '#fff' 
      }}
    >
      {/* Dark Overlay to make text readable */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(17, 17, 17, 0.85)', zIndex: 1 }}></div>
      
      <div className="v2-wrap v2-news v2-reveal" style={{ position: 'relative', zIndex: 2 }}>
        <h2 className="v2-display v2-h2">{copy.title}</h2>
        <p className="v2-lede">{copy.text}</p>
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="v2-email" className="sr-only">{copy.label}</label>
          <input 
            id="v2-email" name="email" type="email" autoComplete="email" 
            placeholder={copy.placeholder} aria-describedby="v2-news-msg" aria-invalid={state === "error"} 
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} // Adjusted input style for dark background
          />
          <button type="submit" className="v2-pill v2-pill--light">{copy.button}</button>
        </form>
        <p id="v2-news-msg" className="v2-news__msg" data-state={state} role="status">{state === "ok" ? copy.ok : state === "error" ? copy.bad : ""}</p>
      </div>
    </section>
  );
}