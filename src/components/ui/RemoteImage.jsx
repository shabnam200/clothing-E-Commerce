"use client";

import { useState } from "react";
import Image from "next/image";

// next/image wrapper for remote (Unsplash / CDN / API) photos and local images.
export default function RemoteImage({ src, fallbackSrc, alt, onError, unoptimized = false, ...props }) {
  const [bad, setBad] = useState([]);
  const fallbacks = Array.isArray(fallbackSrc) ? fallbackSrc : [fallbackSrc];
  const current = [src, ...fallbacks].find((s) => s && !bad.includes(s));
  if (!current) return null;

  // Ensure local paths start with a slash if they are not absolute URLs
  const imageSrc = typeof current === "string" && !current.startsWith("http") && !current.startsWith("/") 
    ? `/${current}` 
    : current;
  const isLocalStorageImage = typeof imageSrc === "string"
    && /^https?:\/\/(localhost|127\.0\.0\.1):8000\/storage\//i.test(imageSrc);

  return (
    <Image
      key={imageSrc}
      src={imageSrc}
      alt={alt}
      // The Laravel dev server is separate from Next. Load its public storage
      // URLs directly so the Next image optimizer does not fail on localhost.
      unoptimized={unoptimized || isLocalStorageImage}
      fill
      onError={(e) => { setBad((b) => [...b, current]); onError?.(e); }}
      {...props}
    />
  );
}
