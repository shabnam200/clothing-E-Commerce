// Dummy catalogue for the AVENOR landing page with professional Unsplash images.
// Text for each key lives in messages/v2/{bn,en}.js (so Bangla/English stay in sync); numbers and image paths live here.

export const V2_COLLAGE = [
  { id: "collage-1", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop" },
  { id: "collage-2", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop" },
  { id: "collage-3", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop" },
  { id: "collage-4", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop" },
  { id: "collage-5", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop" },
  { id: "collage-6", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800&auto=format&fit=crop" },
  { id: "collage-7", image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=800&auto=format&fit=crop" },
  { id: "collage-8", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop" },
  { id: "collage-9", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop" },
];

export const V2_GENDERS = [
  { key: "men", off: 40, image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop" },
  { key: "women", off: 40, image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop" },
  { key: "kids", off: 30, image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=800&auto=format&fit=crop" },
];

export const V2_CATEGORIES = [
  { key: "shirts", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop" },
  { key: "tshirts", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop" },
  { key: "jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop" },
  { key: "dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop" },
  { key: "kurtas", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800&auto=format&fit=crop" },
  { key: "jackets", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop" },
  { key: "accessories", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop" },
];

// tags decide which tab shows the product: sale | new | best.  genders: which Men / Women / Kids pages list it.
// sizes: "ONE" is shown as "One size" (translated in the UI). This array is the single place to swap for API / DB data later;
// everything else (pages, cart, wishlist, search) reads products through lib/v2/catalog.js.
// tags decide which tab shows the product: sale | new | best.  genders: which Men / Women / Kids pages list it.
// sizes: "ONE" is shown as "One size" (translated in the UI). 
export const V2_PRODUCTS = [
  { id: 1, key: "linenShirt", category: "shirts", genders: ["men", "women"], price: 1890, mrp: 2390, rating: 4.7, reviews: 128, tags: ["sale", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Navy", hex: "#1a2a40"}, {name: "White", hex: "#ffffff"}], stock: 12, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop" },
  { id: 2, key: "floralDress", category: "dresses", genders: ["women"], price: 2650, mrp: null, rating: 4.8, reviews: 94, tags: ["new", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Floral Red", hex: "#d94c4c"}], stock: 3, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop" },
  { id: 3, key: "poloTee", category: "tshirts", genders: ["men"], price: 1190, mrp: null, rating: 4.6, reviews: 210, tags: ["best", "new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Black", hex: "#000000"}, {name: "Olive", hex: "#4b5320"}], stock: 0, image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=800&auto=format&fit=crop" },
  { id: 4, key: "kurta", category: "kurtas", genders: ["men"], price: 2490, mrp: 2990, rating: 4.9, reviews: 76, tags: ["sale", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Mustard", hex: "#ffdb58"}], stock: 15, image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800&auto=format&fit=crop" },
  { id: 5, key: "denimJacket", category: "jackets", genders: ["men", "women"], price: 3490, mrp: null, rating: 4.7, reviews: 63, tags: ["best", "new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Blue Denim", hex: "#4682b4"}], stock: 5, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop" },
  { id: 6, key: "slimJeans", category: "jeans", genders: ["men", "women"], price: 2190, mrp: 2690, rating: 4.5, reviews: 187, tags: ["sale"], sizes: ["28", "30", "32", "34"], colors: [{name: "Black", hex: "#000000"}, {name: "Light Blue", hex: "#add8e6"}], stock: 20, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop" },
  { id: 7, key: "oversizedTee", category: "tshirts", genders: ["men", "women"], price: 990, mrp: null, rating: 4.4, reviews: 142, tags: ["new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "White", hex: "#ffffff"}, {name: "Grey", hex: "#808080"}], stock: 8, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop" },
  { id: 8, key: "woolOvershirt", category: "jackets", genders: ["men"], price: 3990, mrp: 4890, rating: 4.8, reviews: 41, tags: ["sale", "new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Brown", hex: "#654321"}], stock: 2, image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=800&auto=format&fit=crop" },
  { id: 9, key: "pleatedDress", category: "dresses", genders: ["women"], price: 2890, mrp: null, rating: 4.7, reviews: 58, tags: ["new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Cream", hex: "#fffdd0"}], stock: 0, image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800&auto=format&fit=crop" },
  { id: 10, key: "toteBag", category: "accessories", genders: ["men", "women"], price: 1490, mrp: 1790, rating: 4.6, reviews: 87, tags: ["sale", "new"], sizes: ["ONE"], colors: [{name: "Beige", hex: "#f5f5dc"}], stock: 30, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop" },
  { id: 11, key: "kidsTee", category: "tshirts", genders: ["kids"], price: 690, mrp: 890, rating: 4.6, reviews: 64, tags: ["sale", "best"], sizes: ["4Y", "6Y", "8Y", "10Y"], colors: [{name: "Yellow", hex: "#ffff00"}, {name: "Blue", hex: "#0000ff"}], stock: 12, image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=800&auto=format&fit=crop" },
  { id: 12, key: "kidsDress", category: "dresses", genders: ["kids"], price: 1490, mrp: null, rating: 4.8, reviews: 39, tags: ["new"], sizes: ["4Y", "6Y", "8Y", "10Y"], colors: [{name: "Pink", hex: "#ffc0cb"}], stock: 6, image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop" },
  { id: 13, key: "kidsJeans", category: "jeans", genders: ["kids"], price: 1290, mrp: 1590, rating: 4.5, reviews: 52, tags: ["sale"], sizes: ["4Y", "6Y", "8Y", "10Y"], colors: [{name: "Blue", hex: "#0000ff"}], stock: 18, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop" },
  { id: 14, key: "kidsJacket", category: "jackets", genders: ["kids"], price: 1890, mrp: null, rating: 4.7, reviews: 33, tags: ["new", "best"], sizes: ["4Y", "6Y", "8Y", "10Y"], colors: [{name: "Green", hex: "#008000"}], stock: 0, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop" },
  { id: 15, key: "checkShirt", category: "shirts", genders: ["men"], price: 1790, mrp: null, rating: 4.5, reviews: 71, tags: ["new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Red/Black", hex: "#8b0000"}], stock: 10, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop" },
  { id: 16, key: "silkKurta", category: "kurtas", genders: ["women"], price: 3290, mrp: 3890, rating: 4.9, reviews: 47, tags: ["sale", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Maroon", hex: "#800000"}], stock: 4, image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop" },
  { id: 17, key: "festiveKurta", category: "kurtas", genders: ["men"], price: 3690, mrp: null, rating: 4.8, reviews: 29, tags: ["new"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Gold", hex: "#ffd700"}], stock: 7, image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop" },
  { id: 18, key: "classicBlazer", category: "jackets", genders: ["men", "women"], price: 5490, mrp: 6490, rating: 4.8, reviews: 36, tags: ["sale", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "Navy", hex: "#000080"}, {name: "Black", hex: "#000000"}], stock: 9, image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop" },
  { id: 19, key: "leatherWatch", category: "accessories", genders: ["men", "women"], price: 2990, mrp: null, rating: 4.7, reviews: 92, tags: ["best", "new"], sizes: ["ONE"], colors: [{name: "Brown Leather", hex: "#8b4513"}], stock: 25, image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop" },
  { id: 20, key: "silkScarf", category: "accessories", genders: ["women"], price: 1190, mrp: null, rating: 4.6, reviews: 45, tags: ["new"], sizes: ["ONE"], colors: [{name: "Peach", hex: "#ffe5b4"}], stock: 14, image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop" },
  { id: 21, key: "ribbedTee", category: "tshirts", genders: ["women"], price: 1090, mrp: null, rating: 4.5, reviews: 83, tags: ["new", "best"], sizes: ["S", "M", "L", "XL"], colors: [{name: "White", hex: "#ffffff"}], stock: 0, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop" },
  { id: 22, key: "highWaistJeans", category: "jeans", genders: ["women"], price: 2390, mrp: 2890, rating: 4.6, reviews: 102, tags: ["sale", "best"], sizes: ["28", "30", "32", "34"], colors: [{name: "Dark Blue", hex: "#00008b"}], stock: 11, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop" },
];