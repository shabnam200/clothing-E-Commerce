import Link from "next/link";
import { BRAND, V2_BASE } from "@/config/v2";

// Original AVENOR wordmark: spaced serif capitals. Colors inherit (currentColor).
export default function V2Logo({ className, name = BRAND.name, logoUrl = "" }) {
  return <Link href={V2_BASE} className={`v2-logo ${className ?? ""}`} aria-label={name}>
    {logoUrl ? <img className="v2-logo__image" src={logoUrl} alt={name} /> : name}
  </Link>;
}
