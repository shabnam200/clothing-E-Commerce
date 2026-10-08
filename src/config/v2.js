// Language-neutral config for the V2 storefront. Nothing here is shared with V1.
export const BRAND = { name: "AVENOR" };

// Change V2_BASE to an empty string to set V2 to the root directory
export const V2_BASE = ""; 
export const FREE_DELIVERY_OVER = 3000;

export const DELIVERY_FEE = 100;   // flat fee below FREE_DELIVERY_OVER (BDT)
export const MAX_QTY = 10;         // per cart line
export const RETURN_WINDOW_DAYS = 7; // return / exchange window, counted from the delivery date

// Customer support channels (placeholders: replace with the real numbers / handles).
export const SUPPORT = {
  phone: "+8801700000000", phoneLabel: "+880 1700-000000",
  whatsapp: "8801700000000",
  email: "hello@avenor.example",
}

// Route helpers: one place to change URLs later (e.g. when the Laravel API / real slugs arrive).
export const ROUTES = {
  // home is now explicitly "/" since V2_BASE is empty
  home: "/", 
  about: `${V2_BASE}/info/about`,
  picks: `${V2_BASE}/#our-picks`,
  lookbook: `${V2_BASE}/lookbook`,
  categories: `${V2_BASE}/#shop-categories-section`,
  contact: `${V2_BASE}/info/contact`,
  support: `${V2_BASE}/support`,
  orders: `${V2_BASE}/account#orders`,
  account: `${V2_BASE}/account`,
  shop: `${V2_BASE}/shop`, 
  cart: `${V2_BASE}/cart`,
  checkout: `${V2_BASE}/checkout`,
  wishlist: `${V2_BASE}/wishlist`, 
  login: `${V2_BASE}/login`, 
  register: `${V2_BASE}/register`,
  product: (id) => `${V2_BASE}/product/${id}`, 
  info: (slug) => `${V2_BASE}/info/${slug}`,
};

// Footer link targets, in the same order as footer.serviceLinks / aboutLinks in messages/v2.
export const FOOTER_HREFS = {
  service: [...["contact", "shipping", "returns", "size", "faq"].map(ROUTES.info), ROUTES.support],
  about: [ROUTES.info("about"), ROUTES.info("story"), ROUTES.info("privacy"), ROUTES.info("terms")],
};

// Brand-level profile pages (replace with the real AVENOR profile URLs once the accounts exist).
export const V2_SOCIALS = [
  { name: "Facebook", href: "https://www.facebook.com/", icon: "facebook" },
  { name: "Instagram", href: "https://www.instagram.com/", icon: "instagram" },
  { name: "TikTok", href: "https://www.tiktok.com/", icon: "tiktok" },
  { name: "YouTube", href: "https://www.youtube.com/", icon: "youtube" },
];

// Offline payment accounts shown on checkout. Replace with the real merchant numbers / bank details.
export const PAYMENT_ACCOUNTS = {
  bkash:  { number: "01700-000000", type: "Personal" },
  nagad:  { number: "01700-000000", type: "Personal" },
  rocket: { number: "01700000000-3", type: "Personal" },
  bank:   { bankName: "Dutch-Bangla Bank PLC", accName: "AVENOR Fashion", accNo: "123.110.0000000", branch: "Gulshan, Dhaka", routing: "090261234" },
};

export const EXPRESS_FEE = 250; // Dhaka next-day delivery (BDT)
