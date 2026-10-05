"use client";

import { useRouter } from "next/navigation";
import { shopHref } from "@/lib/v2/filters";

export default function V2SortSelect({ label, value, options, f }) {
  const router = useRouter();
  return (
    <label className="v2-sort">
      <span>{label}</span>
      <select value={value} onChange={(e) => router.push(shopHref({ ...f, sort: e.target.value }), { scroll: false })}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
