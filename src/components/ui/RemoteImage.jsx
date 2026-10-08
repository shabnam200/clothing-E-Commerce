"use client";

import { useState } from "react";
import Image from "next/image";

// next/image wrapper for remote (Unsplash / CDN / API) photos and local images.
export default function RemoteImage({ src, fallbackSrc, alt, onError, ...props }) {
  const [bad, setBad] = useState([]);
  const current = [src, fallbackSrc].find((s) => s && !bad.includes(s));
  if (!current) return null;

  // Ensure local paths start with a slash if they are not absolute URLs
  const imageSrc = typeof current === "string" && !current.startsWith("http") && !current.startsWith("/") 
    ? `/${current}` 
    : current;

  return (
    <Image
      key={imageSrc}
      src={imageSrc}
      alt={alt}
      fill
      onError={(e) => { setBad((b) => [...b, current]); onError?.(e); }}
      {...props}
    />
  );
}