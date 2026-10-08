// Structured copy for the footer info pages (/info/[slug]). Block types are rendered by V2InfoView:
// channels | links | facts | steps | list | table | faq | text | note
const infoEn = {
  contact: {
    title: "Contact Us",
    lead: "We’re happy to help with orders, sizing or anything else.",
    blocks: [
      { type: "channels", items: ["Call us", "WhatsApp", "Email us"] },
      { type: "facts", title: "When we’re here", items: [["Every day", "10am – 8pm", "Dhaka time. Messages sent later are answered the next day."]] },
    ],
  },
  shipping: {
    title: "Shipping & Delivery",
    lead: "We deliver across Bangladesh, straight to your door.",
    blocks: [
      { type: "facts", title: "Delivery time", items: [["Dhaka", "1–3 days"], ["Other districts", "3–5 days"]] },
      { type: "facts", title: "Delivery cost", items: [["Orders over ৳3,000", "Free"], ["Orders under ৳3,000", "৳100", "Flat fee"]] },
      { type: "note", text: "In a hurry? Choose Dhaka next-day express (৳250) at checkout." },
    ],
  },
  returns: {
    title: "Returns & Exchange",
    lead: "Not the right fit? Return or exchange unworn, unwashed items with their tags within 7 days of delivery.",
    blocks: [
      { type: "facts", items: [["Return window", "7 days", "Counted from the delivery date"], ["Pickup", "Free", "Our team arranges it by phone"]] },
      { type: "steps", title: "How it works", items: [
        ["Open your orders", "Go to My Account > Orders."],
        ["Start the request", "Tap “Return / Exchange” on the delivered order."],
        ["Tell us why", "Pick a reason and send the request."],
        ["Hand it over", "Our team will call you to arrange a free pickup."],
      ] },
      { type: "text", title: "Refunds & exchanges", paras: [
        "Refunds go back to your original payment method (or bKash / Nagad for cash on delivery orders) once the item passes a quick quality check.",
        "Exchanges are shipped as soon as the item reaches us.",
      ] },
      { type: "list", title: "These can’t be returned", items: ["Sale items", "Innerwear", "Items without tags"] },
    ],
  },
  size: {
    title: "Size Guide",
    lead: "A quick guide to how our sizes run.",
    blocks: [
      { type: "table", head: ["Category", "Sizes"], rows: [["Tops & dresses", "S to XL"], ["Jeans", "Waist 28 to 34"], ["Kids’ wear", "4 to 10 years"]] },
      { type: "note", text: "Between two sizes? We suggest sizing up for a relaxed fit." },
    ],
  },
  faq: {
    title: "FAQ",
    lead: "Quick answers to what customers ask most.",
    blocks: [
      { type: "faq", items: [
        ["How long does delivery take?", "Usually 1–5 days depending on your location: 1–3 days in Dhaka and 3–5 days elsewhere."],
        ["Is delivery free?", "Yes, on orders over ৳3,000. Otherwise a flat ৳100 fee applies."],
        ["Which payment methods do you accept?", "bKash, Nagad, cards and cash on delivery."],
        ["Can I return or exchange an item?", "Yes. Unworn, unwashed items with tags can be returned or exchanged within 7 days of delivery."],
      ] },
    ],
  },
  about: {
    title: "About Us",
    lead: "AVENOR designs unisex essentials with honest fabrics, clean cuts and a calm palette, so getting dressed feels easy and looks considered.",
    blocks: [
      { type: "split", title: "Who we are", image: 3, alt: "Model in a considered AVENOR outfit", paras: [
        "AVENOR began with a simple idea: everyday clothes should feel considered, not complicated.",
        "We make unisex pieces for men, women and kids, made in Bangladesh and delivered across the country.",
      ] },
      { type: "values", title: "What we hold to", items: [
        ["Honest fabrics", "Breathable, skin-friendly fabric that stays colour-fast and keeps its shape after wash."],
        ["Clean cuts", "Considered cuts and clean finishing, so every piece sits well and looks tidy."],
        ["A calm palette", "Quiet neutrals that mix and match, so getting dressed feels easy."],
      ] },
      { type: "facts", title: "Our promise", items: [["Made for", "Everyone", "Unisex pieces for men, women and kids"], ["Delivery", "All Bangladesh", "Free on orders over ৳3,000"], ["Exchange", "7 days", "Simple returns, free pickup"]] },
      { type: "cta", title: "Find your next favourite piece", items: [["Shop the collection", "shop"], ["See the lookbook", "lookbook"]] },
    ],
  },
  story: {
    title: "Our Story",
    lead: "AVENOR began with a simple idea: everyday clothes should feel considered, not complicated.",
    blocks: [
      { type: "text", paras: ["We design unisex essentials with honest fabrics, clean cuts and a calm palette."] },
      { type: "list", title: "What we hold to", items: ["Honest fabrics", "Clean cuts", "A calm palette"] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    lead: "We only collect what we need to process your orders and improve your experience.",
    blocks: [
      { type: "text", title: "Your data", paras: ["We never sell your personal data."] },
      { type: "note", text: "This is a placeholder policy for the frontend preview." },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    lead: "By placing an order you agree to our pricing, delivery and exchange policies.",
    blocks: [
      { type: "note", text: "This is placeholder text for the frontend preview and will be replaced with the final terms." },
    ],
  },
};
export default infoEn;
