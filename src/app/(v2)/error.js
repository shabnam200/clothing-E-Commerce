"use client";

import { useEffect } from "react";

// Friendly fallback when a storefront page throws while rendering (instead of a bare "Internal Server Error").
export default function V2Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="v2-wrap v2-page" style={{ textAlign: "center", paddingBlock: "80px" }}>
      <h1 className="v2-h2">Something went wrong / কিছু একটা সমস্যা হয়েছে</h1>
      <p className="v2-lede" style={{ marginTop: 12 }}>Please try again. / অনুগ্রহ করে আবার চেষ্টা করুন।</p>
      <button type="button" style={{ marginTop: 24, padding: "12px 28px", background: "#111", color: "#fff", border: 0, cursor: "pointer" }} onClick={() => reset()}>Try again / আবার চেষ্টা করুন</button>
    </div>
  );
}
