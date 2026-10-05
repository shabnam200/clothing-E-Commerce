// Language-neutral config for the V2 storefront. Nothing here is shared with V1.
export const BRAND = { name: "AVENOR" };

// Change V2_BASE to an empty string to set V2 to the root directory
export const V2_BASE = ""; 
export const FREE_DELIVERY_OVER = 3000;

export const DELIVERY_FEE = 100;   // flat fee below FREE_DELIVERY_OVER (BDT)
export const MAX_QTY = 10;         // per cart line

// Route helpers: one place to change URLs later (e.g. when the Laravel API / real slugs arrive).
export const ROUTES = {
  // home is now explicitly "/" since V2_BASE is empty
  home: "/", 
  about: `${V2_BASE}/#about`, 
  lookbook: `${V2_BASE}/#lookbook`, 
  shop: `${V2_BASE}/shop`, 
  cart: `${V2_BASE}/cart`,
  wishlist: `${V2_BASE}/wishlist`, 
  login: `${V2_BASE}/login`, 
  register: `${V2_BASE}/register`,
  product: (id) => `${V2_BASE}/product/${id}`, 
  info: (slug) => `${V2_BASE}/info/${slug}`,
};

// Footer link targets, in the same order as footer.quickLinks / serviceLinks / aboutLinks in messages/v2.
export const FOOTER_HREFS = {
  quick: [ROUTES.home, ROUTES.shop, ROUTES.lookbook, `${ROUTES.shop}?tag=sale`, `${ROUTES.shop}?tag=new`],
  service: ["contact", "shipping", "returns", "size", "faq"].map(ROUTES.info),
  about: [ROUTES.about, ROUTES.info("story"), ROUTES.info("privacy"), ROUTES.info("terms")],
};

// Brand-level profile pages (replace with the real AVENOR profile URLs once the accounts exist).
export const V2_SOCIALS = [
  { name: "Facebook", href: "https://www.facebook.com/", icon: "facebook" },
  { name: "Instagram", href: "https://www.instagram.com/", icon: "instagram" },
  { name: "TikTok", href: "https://www.tiktok.com/", icon: "tiktok" },
  { name: "YouTube", href: "https://www.youtube.com/", icon: "youtube" },
];