import Link from "@/components/ui/AppLink";
import { BRAND, V2_BASE } from "@/config/v2";

export default function V2Logo({ className, name = BRAND.name, logoUrl = "" }) {
  const nameLength = Array.from(String(name || "")).length;
  const nameFontSize = Math.max(14, Math.min(20, 20 - Math.max(0, nameLength - 14) * 0.35));

  return <Link href={V2_BASE} className={`v2-logo ${className ?? ""}`} aria-label={name}>
    {logoUrl && <img className="v2-logo__image" src={logoUrl} alt="" />}
    <span className="v2-logo__word" style={{ "--v2-logo-name-size": `${nameFontSize}px` }} title={name}>{name}</span>
  </Link>;
}
