import { cache } from "react";
import { cookies } from "next/headers";
import bn from "@/messages/v2/bn";
import en from "@/messages/v2/en";
import { getSettings } from "@/lib/v2/settings";
import { fillTokens, settingTokens } from "@/lib/v2/tokens";

// Filled once per request per language (settings are cached per request too), so 50 callers cost one deep copy.
const build = cache(async (lang) => {
  const settings = await getSettings();
  return fillTokens(lang === "en" ? en : bn, settingTokens(settings, lang));
});

// V2 copy. Reads the same "lang" preference cookie the language switch writes (Bangla default).
// Delivery fee / free-delivery limit / express fee / return days in the copy come from the live storefront settings.
export async function getV2Locale() {
  const lang = (await cookies()).get("lang")?.value === "en" ? "en" : "bn";
  return { lang, v2: await build(lang) };
}
