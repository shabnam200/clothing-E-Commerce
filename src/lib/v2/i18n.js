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
  const settings = await getSettings();
  const languageMode = ["en", "bn", "both"].includes(settings.languageMode) ? settings.languageMode : "both";
  const preferred = (await cookies()).get("lang")?.value === "en" ? "en" : "bn";
  const lang = languageMode === "both" ? preferred : languageMode;
  return { lang, languageMode, v2: await build(lang) };
}
