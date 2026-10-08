// Dummy catalogue for the AVENOR landing page with professional Unsplash images.
// Text for each key lives in messages/v2/{bn,en}.js (so Bangla/English stay in sync); numbers and image paths live here.

export const V2_COLLAGE = [
  { id: "collage-1", image: "/v2/collage/collage-1.jpg" },
  { id: "collage-2", image: "/v2/collage/collage-2.jpg" },
  { id: "collage-3", image: "/v2/collage/collage-3.jpg" },
  { id: "collage-4", image: "/v2/collage/collage-4.jpg" },
  { id: "collage-5", image: "/v2/collage/collage-5.jpg" },
  { id: "collage-6", image: "/v2/collage/collage-6.jpg" },
  { id: "collage-7", image: "/v2/collage/puja.jpg" },
  { id: "collage-8", image: "/v2/collage/puja1.jpg" },
  { id: "collage-9", image: "/v2/collage/spring summer.jpg" },
];

export const V2_GENDERS = [
  { key: "men", off: 40, image: "/images/men.png" },
  { key: "women", off: 40, image: "/images/women.png" },
  { key: "kids", off: 30, image: "/images/kids.png" },
];

export const V2_CATEGORIES = [
  { key: "shirts", image: "/v2/categories/shirts.jpg" },
  { key: "tshirts", image: "/v2/categories/tees.png" },
  { key: "jeans", image: "/v2/categories/jeans.png" },
  { key: "dresses", image: "/v2/categories/dresses.png" },
  { key: "kurtas", image: "/v2/categories/kurtas.png" },
  { key: "jackets", image: "/v2/categories/jackets.png" },
  { key: "accessories", image: "/v2/categories/accessories.jpg" },
];

// tags decide which tab shows the product: sale | new | best.  genders: which Men / Women / Kids pages list it.
// sizes: "ONE" is shown as "One size" (translated in the UI). This array is the single place to swap for API / DB data later;
// everything else (pages, cart, wishlist, search) reads products through lib/v2/catalog.js.
// tags decide which tab shows the product: sale | new | best.  genders: which Men / Women / Kids pages list it.
// sizes: "ONE" is shown as "One size" (translated in the UI). 
export const V2_PRODUCTS = [
  { id: 1, key: "linenShirt", category: "shirts", genders: ["men", "women"], price: 1890, mrp: 2390, rating: 4.7, reviews: 128, tags: ["sale", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Navy", hex: "#1a2a40"}, {name: "White", hex: "#ffffff"}], stock: 12, image: "/v2/products/linen-shirt.jpg" },
  { id: 2, key: "floralDress", category: "dresses", genders: ["women"], price: 2650, mrp: null, rating: 4.8, reviews: 94, tags: ["new", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Floral Red", hex: "#d94c4c"}], stock: 3, image: "/v2/products/rose-dress.jpg" },
  { id: 3, key: "poloTee", category: "tshirts", genders: ["men"], price: 1190, mrp: null, rating: 4.6, reviews: 210, tags: ["best", "new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Black", hex: "#000000"}, {name: "Olive", hex: "#4b5320"}], stock: 0, image: "/v2/products/polo-tee.jpg" },
  { id: 4, key: "kurta", category: "kurtas", genders: ["men"], price: 2490, mrp: 2990, rating: 4.9, reviews: 76, tags: ["sale", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Mustard", hex: "#ffdb58"}], stock: 15, image: "/v2/products/sand-panjabi.jpg" },
  { id: 5, key: "denimJacket", category: "jackets", genders: ["men", "women"], price: 3490, mrp: null, rating: 4.7, reviews: 63, tags: ["best", "new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Blue Denim", hex: "#4682b4"}], stock: 5, image: "/v2/products/denim-jacket.jpg" },
  { id: 6, key: "slimJeans", category: "jeans", genders: ["men", "women"], price: 2190, mrp: 2690, rating: 4.5, reviews: 187, tags: ["sale"], sizes: ["28", "30", "32", "34"], colors: [{name: "Black", hex: "#000000"}, {name: "Light Blue", hex: "#add8e6"}], stock: 20, image: "/v2/products/slim-jeans.jpg" },
  { id: 7, key: "oversizedTee", category: "tshirts", genders: ["men", "women"], price: 990, mrp: null, rating: 4.4, reviews: 142, tags: ["new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "White", hex: "#ffffff"}, {name: "Grey", hex: "#808080"}], stock: 8, image: "/v2/products/oversized-tee.jpg" },
  { id: 8, key: "woolOvershirt", category: "jackets", genders: ["men"], price: 3990, mrp: 4890, rating: 4.8, reviews: 41, tags: ["sale", "new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Brown", hex: "#654321"}], stock: 2, image: "/v2/products/wool-overshirt.jpg" },
  { id: 9, key: "pleatedDress", category: "dresses", genders: ["women"], price: 2890, mrp: null, rating: 4.7, reviews: 58, tags: ["new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Cream", hex: "#fffdd0"}], stock: 0, image: "/v2/products/pleated dress.jpg" },
  { id: 10, key: "toteBag", category: "accessories", genders: ["men", "women"], price: 1490, mrp: 1790, rating: 4.6, reviews: 87, tags: ["sale", "new"], sizes: ["ONE"], colors: [{name: "Beige", hex: "#f5f5dc"}], stock: 30, image: "/v2/products/canvas-tote.jpg" },
  { id: 11, key: "kidsTee", category: "tshirts", genders: ["kids"], price: 690, mrp: 890, rating: 4.6, reviews: 64, tags: ["sale", "best"], sizes: ["4Y", "6Y", "8Y", "10Y"], colors: [{name: "Yellow", hex: "#ffff00"}, {name: "Blue", hex: "#0000ff"}], stock: 12, image: "/v2/products/kids graphic tee.jpg" },
  { id: 12, key: "kidsDress", category: "dresses", genders: ["kids"], price: 1490, mrp: null, rating: 4.8, reviews: 39, tags: ["new"], sizes: ["4Y", "6Y", "8Y", "10Y"], colors: [{name: "Pink", hex: "#ffc0cb"}], stock: 6, image: "v2/products/kid_dress.jpg" },
  { id: 13, key: "kidsJeans", category: "jeans", genders: ["kids"], price: 1290, mrp: 1590, rating: 4.5, reviews: 52, tags: ["sale"], sizes: ["4Y", "6Y", "8Y", "10Y"], colors: [{name: "Blue", hex: "#0000ff"}], stock: 18, image: "v2/products/kid jeans.jpg" },
  { id: 14, key: "kidsJacket", category: "jackets", genders: ["kids"], price: 1890, mrp: null, rating: 4.7, reviews: 33, tags: ["new", "best"], sizes: ["4Y", "6Y", "8Y", "10Y"], colors: [{name: "Green", hex: "#008000"}], stock: 0, image: "/v2/products/kids jacket.jpg" },
  { id: 15, key: "checkShirt", category: "shirts", genders: ["men"], price: 1790, mrp: null, rating: 4.5, reviews: 71, tags: ["new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Red/Black", hex: "#8b0000"}], stock: 10, image: "/v2/products/forest-shirt.jpg" },
  { id: 16, key: "silkKurta", category: "kurtas", genders: ["women"], price: 3290, mrp: 3890, rating: 4.9, reviews: 47, tags: ["sale", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Maroon", hex: "#800000"}], stock: 4, image: "/v2/products/cotton-kurta.jpg" },
  { id: 17, key: "festiveKurta", category: "kurtas", genders: ["men"], price: 3690, mrp: null, rating: 4.8, reviews: 29, tags: ["new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Gold", hex: "#ffd700"}], stock: 7, image: "/v2/products/festive kurta.jpg"},
  { id: 18, key: "classicBlazer", category: "jackets", genders: ["men", "women"], price: 5490, mrp: 6490, rating: 4.8, reviews: 36, tags: ["sale", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Navy", hex: "#000080"}, {name: "Black", hex: "#000000"}], stock: 9, image: "/v2/products/rust-jacket.jpg" },
  { id: 19, key: "leatherWatch", category: "accessories", genders: ["men", "women"], price: 2990, mrp: null, rating: 4.7, reviews: 92, tags: ["best", "new"], sizes: ["ONE"], colors: [{name: "Brown Leather", hex: "#8b4513"}], stock: 25, image: "/v2/products/leather watch.jpg" },
  { id: 20, key: "silkScarf", category: "accessories", genders: ["women"], price: 1190, mrp: null, rating: 4.6, reviews: 45, tags: ["new"], sizes: ["ONE"], colors: [{name: "Peach", hex: "#ffe5b4"}], stock: 14, image: "/v2/products/slik scarf.jpg"},
  { id: 21, key: "ribbedTee", category: "tshirts", genders: ["women"], price: 1090, mrp: null, rating: 4.5, reviews: 83, tags: ["new", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "White", hex: "#ffffff"}], stock: 0, image: "/v2/products/ribbed tee.jpg" },
  { id: 22, key: "highWaistJeans", category: "jeans", genders: ["women"], price: 2390, mrp: 2890, rating: 4.6, reviews: 102, tags: ["sale", "best"], sizes: ["28", "30", "32", "34"], colors: [{name: "Dark Blue", hex: "#00008b"}], stock: 11, image: "/v2/products/high waist.jpg" },
];