"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

// Client: needs the pathname to mark the active link (yellow, like the zip).
export default function NavLinks({ links, className, onNavigate }) {
  const pathname = usePathname();
  return (
    <ul className={className}>
      {links.map(({ key, label, href, tone }) => (
        <li key={key}>
          <Link href={href} onClick={onNavigate} aria-current={href === pathname ? "page" : undefined}
            className={cn("rounded px-3 py-1 text-lg transition-colors hover:text-accent", tone === "sale" ? "text-sale" : href === pathname ? "text-accent" : "text-ink")}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
