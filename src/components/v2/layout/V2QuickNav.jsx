"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiShoppingBag, FiTag } from "react-icons/fi";
import { ROUTES } from "@/config/v2";

// Floating Shop / Sale shortcut on the right edge (bottom-right on phones).
export default function V2QuickNav({ lang }) {
  const pathname = usePathname();
  if (pathname.startsWith(ROUTES.checkout)) return null;
  const bn = lang === "bn";
  return (
    <nav className="v2-quick" aria-label={bn ? "দ্রুত লিংক" : "Quick links"}>
      <Link href={ROUTES.shop} className="v2-quick__a" aria-label={bn ? "শপ" : "Shop"}>
        <FiShoppingBag aria-hidden="true" /><span>{bn ? "শপ" : "Shop"}</span>
      </Link>
      <Link href={`${ROUTES.shop}?tag=sale`} className="v2-quick__a v2-quick__a--sale" aria-label={bn ? "সেল" : "Sale"}>
        <FiTag aria-hidden="true" /><span>{bn ? "সেল" : "Sale"}</span><i className="v2-quick__dot" aria-hidden="true" />
      </Link>
    </nav>
  );
}
