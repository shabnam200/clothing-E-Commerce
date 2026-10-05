"use client";

import { useState } from "react";
import Image from "next/image";

// next/image wrapper for remote (Unsplash / CDN / API) photos.
// If the URL fails to load it renders nothing, so the parent's tonal background shows instead of a broken-image icon.
// Pass `fallbackSrc` to try a second URL before giving up. Use inside a `relative` parent (it uses `fill`).
export default function RemoteImage({ src, fallbackSrc, alt, onError, ...props }) {
  const [bad, setBad] = useState([]);
  const current = [src, fallbackSrc].find((s) => s && !bad.includes(s));
  if (!current) return null;
  return (
    <Image
      key={current}
      src={current}
      alt={alt}
      fill
      onError={(e) => { setBad((b) => [...b, current]); onError?.(e); }}
      {...props}
    />
  );
}
