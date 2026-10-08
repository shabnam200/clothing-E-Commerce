"use client";

import Link from "next/link";
import { FiCheck, FiUser } from "react-icons/fi";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { SIZE_COPY, sizeKind } from "@/lib/v2/size";
import { ROUTES } from "@/config/v2";

// Under the size picker: "Your size: M" (from the size passport) or a link to add measurements.
export default function V2SizeHint({ product, selected, onPick }) {
  const { lang, hydrated, recommendFor, sizeLabel } = useV2Store();
  const t = SIZE_COPY[lang] || SIZE_COPY.en;
  if (!hydrated || !sizeKind(product)) return null;
  const rec = recommendFor(product);
  if (!rec) {
    return <p className="v2-sizehint"><FiUser aria-hidden="true" /><Link href={`${ROUTES.account}#profile`}>{t.prompt}</Link></p>;
  }
  return (
    <p className="v2-sizehint is-set" title={t.fromProfile}>
      <FiCheck aria-hidden="true" />
      <span>{t.yourSize}: <b>{sizeLabel(rec)}</b></span>
      {selected === rec
        ? <em>{t.selected}</em>
        : <button type="button" onClick={() => onPick?.(rec)}>{t.select} {sizeLabel(rec)}</button>}
    </p>
  );
}
