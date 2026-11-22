import { NextResponse } from "next/server";
import { cfg } from "@/services/dokani/config";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // matches the backend limit
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Browser -> this route (multipart "image", signed-in shopper token) -> backend POST /payment-proof -> { url }.
// The generic /api/shopper gateway only forwards JSON, so uploads need their own route.
export async function POST(request) {
  const fail = (message, status = 422) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return fail("Please sign in to upload a payment screenshot.", 401);

    const incoming = await request.formData().catch(() => null);
    const file = incoming?.get("image");
    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") return fail("Choose a screenshot to upload.");
    if (!TYPES.has(file.type)) return fail("Please choose a JPG, PNG or WebP image.");
    if (file.size > MAX_BYTES) return fail("The image must be 5 MB or smaller.");

    const outgoing = new FormData();
    outgoing.append("image", file, file.name || "payment-proof");

    const c = cfg();
    const response = await fetch(`${c.baseUrl}/payment-proof`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(30000),
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: outgoing,
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) return fail(data?.message || "Please sign in again.", 401);
    if (!response.ok || !data?.url) return fail(data?.message || "Could not upload the screenshot. Please try again.", response.status >= 400 && response.status < 600 ? response.status : 422);
    return NextResponse.json({ url: data.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error?.name === "TimeoutError" ? "The upload took too long. Please try again." : "Could not upload the screenshot. Please try again.", 503);
  }
}
