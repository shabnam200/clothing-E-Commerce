"use client";

import Link from "next/link";
import { forwardRef, useState } from "react";

// Drop-in replacement for next/link.
// next/link prefetches every link that scrolls into view (the "?_rsc=" requests in the Network tab). On a store with a big
// footer, category lists and product grids that is 100+ requests per visit. Here nothing is prefetched until the visitor
// shows intent (hover / keyboard focus / touch), so only the page they are about to open is fetched.
// Pass prefetch={true} to force the default behaviour for a specific link (e.g. the main "Shop" button).
const AppLink = forwardRef(function AppLink({ prefetch, onMouseEnter, onFocus, onTouchStart, ...props }, ref) {
  const [intent, setIntent] = useState(false);
  const arm = (handler) => (event) => { setIntent(true); handler?.(event); };
  return (
    <Link
      ref={ref}
      {...props}
      prefetch={prefetch !== undefined ? prefetch : intent ? null : false}
      onMouseEnter={arm(onMouseEnter)}
      onFocus={arm(onFocus)}
      onTouchStart={arm(onTouchStart)}
    />
  );
});

export default AppLink;
