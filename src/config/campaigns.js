// Festival / campaign mode (Eid, Pohela Boishakh, Durga Puja).
//
// The admin panel decides what is live through  GET {CAMPAIGNS_API_URL}  (or {NEXT_PUBLIC_API_URL}/campaigns).
// Expected JSON: an array (or { data: [...] }) of
//   { id, type: "eid" | "boishakh" | "puja", enabled: true|false,   <- the admin on/off switch
//     starts_at, ends_at,                                           <- when the theme, bar and slide are shown
//     order_deadline,                                               <- "order by this date to get it before the festival"
//     image?, cta_href?, priority?, title_bn?, title_en?, text_bn?, text_en? }   <- optional overrides
// snake_case and camelCase keys are both accepted (see lib/v2/campaigns.js).
// `image` can be a /public path or a full URL (full URLs need their host in next.config.mjs -> images.remotePatterns).
//
// While no API URL is set, CAMPAIGN_FALLBACK below is used. Its dates are PLACEHOLDERS: the real dates come from the admin panel.
// To preview locally without touching dates, set  CAMPAIGN_PREVIEW=eid,boishakh,puja  in .env.local (any mix, first one sets the theme).

export const CAMPAIGN_TYPES = {
  eid: {
    theme: "eid",
    ctaHref: "/shop?category=kurtas",
    image: "/campaigns/eid.jpg", imagePosition: "50% 50%",
    bn: {
      eyebrow: "ঈদ কালেকশন",
      title: "ঈদের আনন্দ, নতুন সাজে",
      text: "উৎসবের পাঞ্জাবি, কুর্তা আর ড্রেস — ঈদের আগেই আপনার দরজায়।",
      cta: "ঈদ কালেকশন দেখুন",
      bar: "ঈদ স্পেশাল",
      deadline: "ঈদের আগে পেতে {date}-এর মধ্যে অর্ডার করুন",
    },
    en: {
      eyebrow: "Eid Collection",
      title: "Eid joy, in a fresh look",
      text: "Festive panjabis, kurtas and dresses, at your door before Eid.",
      cta: "Shop the Eid edit",
      bar: "Eid Special",
      deadline: "Order by {date} to get it before Eid",
    },
  },
  boishakh: {
    theme: "boishakh",
    ctaHref: "/shop?q=lal",
    image: "/campaigns/puja1.jpg", imagePosition: "50% 12%", // same photo as Puja
    bn: {
      eyebrow: "শুভ নববর্ষ",
      title: "পহেলা বৈশাখের লাল-সাদা সাজ",
      text: "বৈশাখী রঙে সাজুন — পাঞ্জাবি, কুর্তা আর ড্রেসে উৎসবের আমেজ।",
      cta: "বৈশাখী কালেকশন দেখুন",
      bar: "পহেলা বৈশাখ",
      deadline: "পহেলা বৈশাখের আগে পেতে {date}-এর মধ্যে অর্ডার করুন",
    },
    en: {
      eyebrow: "Shubho Noboborsho",
      title: "Pohela Boishakh in red and white",
      text: "Dress in the colours of Boishakh: panjabis, kurtas and dresses with a festive feel.",
      cta: "Shop the Boishakh edit",
      bar: "Pohela Boishakh",
      deadline: "Order by {date} to get it before Pohela Boishakh",
    },
  },
  puja: {
    theme: "puja",
    ctaHref: "/shop?gender=women",
    image: "/campaigns/puja1.jpg", imagePosition: "50% 12%",
    bn: {
      eyebrow: "শারদীয় উৎসব",
      title: "পূজার সাজে, নতুন রূপে",
      text: "উৎসবের রঙে সাজুন — শারদীয় পূজার জন্য বাছাই করা পোশাক আর অ্যাক্সেসরিজ।",
      cta: "পূজা কালেকশন দেখুন",
      bar: "শুভ শারদীয়া",
      deadline: "পূজার আগে পেতে {date}-এর মধ্যে অর্ডার করুন",
    },
    en: {
      eyebrow: "Sharodiya Edit",
      title: "Dressed for Puja, in full colour",
      text: "Festive looks and accessories, picked for the Durga Puja days.",
      cta: "Shop the Puja edit",
      bar: "Shubho Sharodiya",
      deadline: "Order by {date} to get it before Puja",
    },
  },
};

// Shared labels. {n} = number.
export const CAMPAIGN_LABELS = {
  bn: {
    daysLeft: "{n} দিন বাকি", lastDay: "আজই শেষ দিন", close: "বন্ধ করুন",
    region: "অফার ও কালেকশন", prev: "আগের ব্যানার", next: "পরের ব্যানার", pause: "স্লাইড থামান", play: "স্লাইড চালু করুন", goTo: "ব্যানার {n}",
  },
  en: {
    daysLeft: "{n} days left", lastDay: "Last day to order", close: "Close",
    region: "Offers and collections", prev: "Previous banner", next: "Next banner", pause: "Pause slideshow", play: "Play slideshow", goTo: "Banner {n}",
  },
};

// Placeholder dates (Asia/Dhaka, +06:00). Durga Puja 2026 follows the Bangladesh holiday calendar (Mahanavami 20 Oct, Bijoya Dashami 21 Oct).
export const CAMPAIGN_FALLBACK = [
  { id: "durga-puja-2026", type: "puja", enabled: true, starts_at: "2026-10-01T00:00:00+06:00", ends_at: "2026-10-21T23:59:59+06:00", order_deadline: "2026-10-15T23:59:59+06:00" },
  { id: "eid-ul-fitr", type: "eid", enabled: true, starts_at: "2027-02-20T00:00:00+06:00", ends_at: "2027-03-12T23:59:59+06:00", order_deadline: "2027-03-04T23:59:59+06:00" },
  { id: "boishakh", type: "boishakh", enabled: true, starts_at: "2027-03-30T00:00:00+06:00", ends_at: "2027-04-15T23:59:59+06:00", order_deadline: "2027-04-09T23:59:59+06:00" },
  { id: "eid-ul-adha", type: "eid", enabled: true, starts_at: "2027-04-28T00:00:00+06:00", ends_at: "2027-05-19T23:59:59+06:00", order_deadline: "2027-05-11T23:59:59+06:00" },
];
