// image: remote URL (Unsplash dummy photos). Replace with your DB/API image URL when ready.
const SIZES = ["S", "M", "L", "XL"];

export const PRODUCTS = [
  { id: 1, gender: "men", price: 2590, mrp: 3490, stock: 14, image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800&auto=format&fit=crop",
    colors: [["Ivory", "#f3ead7"], ["Navy", "#1e2a4a"], ["Maroon", "#7a1f2b"]], sizes: SIZES, soldOut: [] },
  { id: 2, gender: "men", price: 1690, mrp: 2390, stock: 22, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop",
    colors: [["Sky", "#9ec5e8"], ["White", "#ffffff"], ["Olive", "#6b7a3a"]], sizes: SIZES, soldOut: ["S"] },
  { id: 3, gender: "women", price: 1990, mrp: 2690, stock: 9, image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop",
    colors: [["Indigo", "#24407a"], ["Teal", "#1f7a7a"]], sizes: SIZES, soldOut: [] },
  { id: 4, gender: "men", price: 790, mrp: 990, stock: 40, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
    colors: [["Black", "#111111"], ["Grey", "#7a7a7a"], ["White", "#ffffff"]], sizes: SIZES, soldOut: [] },
  { id: 5, gender: "men", price: 6490, mrp: 8990, stock: 5, image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
    colors: [["Charcoal", "#3a3a3a"], ["Navy", "#1b2a49"]], sizes: SIZES, soldOut: ["XL"] },
  { id: 6, gender: "women", price: 3150, mrp: 4390, stock: 7, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop",
    colors: [["Mustard", "#d9a21b"], ["Sage", "#8fa37a"], ["Beige", "#d8c8a8"]], sizes: SIZES, soldOut: [] },
];

export const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "men", label: "Men", test: (p) => p.gender === "men" },
  { id: "women", label: "Women", test: (p) => p.gender === "women" },
  { id: "sale", label: "Sale 25%+", test: (p) => discountPercent(p) >= 25 },
];

export const discountPercent = ({ price, mrp }) => Math.round(((mrp - price) / mrp) * 100);
