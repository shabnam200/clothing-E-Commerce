import { cache } from "react";
import { dokaniGet } from "@/services/dokani/client";
import { toSettings } from "@/services/adapters";
import { DELIVERY_FEE, DISTRICTS, EXPRESS_FEE, FREE_DELIVERY_OVER, MAX_QTY, PAYMENT_ACCOUNTS, POINTS_PER_TAKA, REFERRAL_REWARD, RETURN_WINDOW_DAYS, SUPPORT } from "@/config/v2";

// Defaults come from config/v2.js; GET /settings (when the API is connected) overrides them, so the business can change a
// delivery fee, bKash number or support phone without a website release. Never throws: a down API just means the defaults.
export const SETTINGS_DEFAULTS = {
  brandNameEn: "AVENOR", brandNameBn: "", languageMode: "both", siteLogoUrl: "", faviconUrl: "", brandLogoUrl: "",
  currency: "BDT", freeDeliveryOver: FREE_DELIVERY_OVER, deliveryFee: DELIVERY_FEE, expressFee: EXPRESS_FEE, maxQtyPerLine: MAX_QTY,
  returnWindowDays: RETURN_WINDOW_DAYS, referralReward: REFERRAL_REWARD, pointsPerTaka: POINTS_PER_TAKA, districts: DISTRICTS,
  support: SUPPORT, paymentAccounts: PAYMENT_ACCOUNTS,
};

export const getSettings = cache(async () => {
  try {
    const response = await dokaniGet("/settings");
    const s = toSettings(response?.settings ?? response ?? {});
    return { ...SETTINGS_DEFAULTS, ...s, support: { ...SETTINGS_DEFAULTS.support, ...s.support }, paymentAccounts: { ...SETTINGS_DEFAULTS.paymentAccounts, ...s.paymentAccounts } };
  } catch { return SETTINGS_DEFAULTS; }
});
