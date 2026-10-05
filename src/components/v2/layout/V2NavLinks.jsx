"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Client only for the active state. Links point at sections of the V2 landing page until the Shop phase exists.
export default function V2NavLinks({ links, className, linkClassName, onNavigate }) {
  const pathname = usePathname();
  return (
    <ul className={className}>
      {links.map(({ key, label, href, tone }) => (
        <li key={key}>
          <Link href={href} onClick={onNavigate} aria-current={href === pathname ? "page" : undefined}
            className={`${linkClassName ?? ""} ${tone === "sale" ? "is-sale" : ""}`.trim()}>{label}</Link>
        </li>
      ))}
    </ul>
  );
}
