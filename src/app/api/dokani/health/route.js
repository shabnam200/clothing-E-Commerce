import { NextResponse } from "next/server";
import { clearCatalogCache, health } from "@/services/dokani/catalog";
import { isEnabled } from "@/services/dokani/config";

// Open  http://localhost:3000/api/dokani/health  to see what the Dokani connection sees (shop, products, stock, problems).
// Never shows passwords or tokens. Switched off in production unless DOKANI_DEBUG=1.
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.DOKANI_DEBUG !== "1") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isEnabled()) return NextResponse.json({ ok: false, problems: ["Dokani is not configured. Put DOKANI_BASE_URL, DOKANI_LOGIN, DOKANI_PASSWORD (and DOKANI_SHOP_ID) in .env.local and restart `next dev`."] });
  clearCatalogCache(); // always a fresh look
  return NextResponse.json(await health(), { headers: { "Cache-Control": "no-store" } });
}
