import { dokaniGet } from "./client";

// Public coupons are read with the server-side Dokani service token; never expose this credential to the browser.
export async function listPublicCoupons() {
  try {
    const data = await dokaniGet("/coupons");
    const rows = Array.isArray(data) ? data : data?.coupons ?? data?.data ?? [];
    return rows.filter((coupon) => coupon?.code && Number(coupon.remaining ?? 1) !== 0);
  } catch (error) {
    console.warn("[coupons] public offers unavailable:", error?.message || error);
    return [];
  }
}
