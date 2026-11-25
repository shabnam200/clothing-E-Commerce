import { NextResponse } from "next/server";
import { getCategories } from "@/lib/v2/catalogSource";
import { categoryPathKeyForGrouping } from "@/lib/v2/categoryKey";
import { getSettings } from "@/lib/v2/settings";

export const dynamic = "force-dynamic";

// Flat list of the shop's real category keys, e.g. [{ key: "skin-care", label: "Skin Care", depth: 0 }, { key: "skin-care-exfoliator", ... }].
// The admin panel uses it so a campaign link is picked from real categories instead of typed by hand (a typo such as "skincare" opens an empty shop).
function flatten(rows, mode, parentKey = "", depth = 0, out = []) {
  for (const category of rows || []) {
    if (category?.visible === false) continue;
    const key = categoryPathKeyForGrouping(category, parentKey, mode);
    if (key) out.push({ key, label: category.name || key, depth });
    flatten(category.subs, mode, key || parentKey, depth + 1, out);
  }
  return out;
}

export async function GET(request) {
  const lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "bn";
  try {
    const [settings, tree] = await Promise.all([getSettings(), getCategories(lang)]);
    return NextResponse.json({ categories: flatten(tree, settings.storefrontGrouping?.mode || "category") }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}
