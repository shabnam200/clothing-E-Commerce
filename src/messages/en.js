const en = {
  meta: { title: "Dokani Fashion — Panjabi, Casual & Formal Wear", description: "Handcrafted panjabis, breezy linens and sharp tailoring, stocked live across every branch near you." },
  nav: { home: "Home", men: "Men", women: "Women", collections: "Collections", sale: "Sale" },
  topbar: { delivery: (a) => `Free delivery on orders over ${a}`, stock: "Check stock at" },
  branches: ["Gulshan Flagship, Dhaka", "Dhanmondi, Dhaka", "Chattogram", "Sylhet"],
  ui: { search: "Search panjabi, shirts…", wishlist: "Wishlist", cart: "Cart", light: "Light", dark: "Dark", menuOpen: "Open menu", menuClose: "Close menu", lang: "বাংলা", langAria: "বাংলায় দেখুন" },
  hero: {
    badge: "Eid & Summer Campaign 2026", line1: "Dress the moment.", line2: "Wear your story.",
    brand: "Dokani Fashion", text: " — handcrafted panjabis, breezy linens and sharp tailoring, stocked live across every branch near you.",
    cta1: "Shop New Arrivals", cta2: "Browse Collections", upTo: "Up to", off: "35% OFF", imgAlt: "Models wearing Dokani panjabi and salwar kameez",
    stats: [["270+", "New styles"], ["4", "Branches"], ["48h", "Delivery"]],
  },
  categories: { eyebrow: "Shop by category", title: "Curated for every", highlight: "occasion", styles: "styles",
    names: { panjabi: "Panjabi", casual: "Casual Wear", formal: "Formal Wear", summer: "Summer Collection" } },
  shop: {
    eyebrow: "New arrivals", title: "Fresh drops from", highlight: "Dokani", filterLabel: "Filter products",
    filters: { all: "All", men: "Men", women: "Women", sale: "Sale 25%+" }, empty: "No products match this filter yet.",
    color: "Color", size: "Size", mrp: "M.R.P.", left: (n, b) => `${n} left at ${b}`, add: "Add to Cart", wish: "Add to wishlist",
    colors: {}, 
    items: {
      1: ["Embroidered Cotton Panjabi", "panjabi"], 2: ["Oxford Button-Down Shirt", "casual"], 3: ["Printed Cotton Kurti", "summer"],
      4: ["Premium Crew Neck Tee", "casual"], 5: ["Slim Fit Wool Blazer", "formal"], 6: ["Linen Midi Summer Dress", "summer"],
    },
  },
  footer: { tagline: "Everyday style, made with care — shop online or visit any Dokani branch near you.", credit: "Product developed by", company: "IT Lab Solutions Ltd.", rights: "All rights reserved.", nav: "Footer menu" },
};
export default en;
