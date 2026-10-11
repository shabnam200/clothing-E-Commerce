import { FiStar } from "react-icons/fi";

// Read-only star row (value 0-5). Decorative: put the rating in text next to it for screen readers.
export default function V2Stars({ value }) {
  const full = Math.round(value);
  return (
    <span className="v2-pd__stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => <FiStar key={n} fill={n <= full ? "currentColor" : "none"} />)}
    </span>
  );
}
