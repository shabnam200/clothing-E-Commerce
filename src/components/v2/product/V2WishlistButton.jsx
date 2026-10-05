"use client";

import { useState } from "react";
import { FiHeart } from "react-icons/fi";

// Local toggle only — real wishlist (storage/account) is a later phase.
export default function V2WishlistButton({ addLabel, removeLabel, name }) {
  const [on, setOn] = useState(false);
  return (
    <button type="button" className="v2-icon-btn v2-wish" aria-pressed={on} aria-label={`${on ? removeLabel : addLabel}: ${name}`} onClick={() => setOn((v) => !v)}>
      <FiHeart aria-hidden="true" fill={on ? "currentColor" : "none"} />
    </button>
  );
}
