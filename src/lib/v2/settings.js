import { cache } from "react";
import { dokaniGet } from "@/services/dokani/client";
import { toSettings } from "@/services/adapters";
import { BRAND, DELIVERY_FEE, DISTRICTS, EXPRESS_FEE, FREE_DELIVERY_OVER, MAX_QTY, PAYMENT_ACCOUNTS, POINTS_PER_TAKA, REFERRAL_REWARD, RETURN_WINDOW_DAYS, SUPPORT } from "@/config/v2";
import { HOMEPAGE_HIGHLIGHTS_DEFAULTS, HOMEPAGE_MENU_DEFAULTS, HOMEPAGE_SECTION_ORDER, HOMEPAGE_SECTION_TITLES_DEFAULTS } from "@/config/homepage";

// Defaults come from config/v2.js; GET /settings (when the API is connected) overrides them, so the business can change a
// delivery fee, bKash number or support phone without a website release. Never throws: a down API just means the defaults.
export const SETTINGS_DEFAULTS = {
  brandNameEn: BRAND.name, brandNameBn: "", languageMode: "both", siteLogoUrl: "", faviconUrl: "", brandLogoUrl: "",
  currency: "BDT", freeDeliveryOver: FREE_DELIVERY_OVER, deliveryFee: DELIVERY_FEE, expressFee: EXPRESS_FEE, maxQtyPerLine: MAX_QTY,
  returnWindowDays: RETURN_WINDOW_DAYS, referralReward: REFERRAL_REWARD, pointsPerTaka: POINTS_PER_TAKA,
  pointRedemptionEnabled: false, takaPerPoint: 0.1, maxPointsDiscountPercent: 50, districts: DISTRICTS,
  support: SUPPORT, paymentAccounts: PAYMENT_ACCOUNTS,
  featureToggles: { home_hero: true, home_categories: true, home_brands: true, home_products: true, home_lookbook: true, home_promotions: true, home_perks: true, footer_newsletter: true, wishlist: true, price_drop_alerts: true, build_a_look: true, order_details: true, track_order: true, refer_and_earn: true, mini_cart: true, buy_again: true, invoice: true },
  homepageSectionOrder: HOMEPAGE_SECTION_ORDER,
  homepageSectionTitles: HOMEPAGE_SECTION_TITLES_DEFAULTS,
  storefrontGrouping: { mode: "category" },
  homepageMenu: HOMEPAGE_MENU_DEFAULTS,
  homepageHighlights: HOMEPAGE_HIGHLIGHTS_DEFAULTS,
  lookbookProductIds: null,
  customPages: [],
  appearance: {},
  seo: { en: {}, bn: {}, og_image: "" },
};

export const getSettings = cache(async () => {
  try {
    const response = await dokaniGet("/settings", {}, { ttl: 3 * 60 * 1000 });
    const s = toSettings(response?.settings ?? response ?? {});
    return { ...SETTINGS_DEFAULTS, ...s, support: { ...SETTINGS_DEFAULTS.support, ...s.support }, paymentAccounts: { ...SETTINGS_DEFAULTS.paymentAccounts, ...s.paymentAccounts }, featureToggles: { ...SETTINGS_DEFAULTS.featureToggles, ...s.featureToggles }, storefrontGrouping: { ...SETTINGS_DEFAULTS.storefrontGrouping, ...s.storefrontGrouping }, homepageSectionTitles: { en: { ...s.homepageSectionTitles?.en }, bn: { ...s.homepageSectionTitles?.bn } }, homepageMenu: Object.fromEntries(Object.entries(HOMEPAGE_MENU_DEFAULTS).map(([key, fallback]) => [key, { ...fallback, ...s.homepageMenu?.[key] }])), homepageHighlights: { en: Array.isArray(s.homepageHighlights?.en) ? s.homepageHighlights.en : [], bn: Array.isArray(s.homepageHighlights?.bn) ? s.homepageHighlights.bn : [] }, seo: { ...SETTINGS_DEFAULTS.seo, ...s.seo, en: { ...SETTINGS_DEFAULTS.seo.en, ...s.seo?.en }, bn: { ...SETTINGS_DEFAULTS.seo.bn, ...s.seo?.bn } } };
  } catch { return SETTINGS_DEFAULTS; }
});

