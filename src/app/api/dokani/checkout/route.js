import { NextResponse } from "next/server";
import { cfg } from "@/services/dokani/config";
import { dokaniGet, dokaniSend } from "@/services/dokani/client";
import { getRawProduct } from "@/services/dokani/catalog";
import { getSettings } from "@/lib/v2/settings";

export const dynamic = "force-dynamic";

const rowsOf = (box) => Array.isArray(box) ? box : Array.isArray(box?.data) ? box.data : [];
const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, "");

async function shopperCustomerId(value) {
  if (!value) return null;
  const c = cfg();
  const response = await fetch(`${c.baseUrl}/auth/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${value}` },
    cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return null;
  const profile = await response.json().catch(() => ({}));
  const contextResponse = await fetch(`${c.baseUrl}/auth/checkout-context`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${value}` },
    cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  const context = await contextResponse.json().catch(() => null);
  if (!contextResponse.ok || !Number.isInteger(Number(context?.customer_id)) || Number(context.customer_id) < 1) {
    const error = new Error(context?.message || "Your account is not linked to a customer record. Please contact the shop.");
    error.status = contextResponse.status;
    throw error;
  }
  return { customerId: Number(context.customer_id), points: Math.max(0, Math.floor(Number(profile?.points) || 0)) };
}

async function validateCoupon(shopperToken, code, subtotal) {
  const c = cfg();
  let response;
  try {
    response = await fetch(`${c.baseUrl}/coupons/validate`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${shopperToken}` },
      body: JSON.stringify({ code, subtotal }),
    });
  } catch (error) {
    const failure = new Error(`Could not verify the coupon (${error?.message || "network error"}).`);
    failure.status = 503;
    throw failure;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.valid !== true) {
    const failure = new Error(data?.message || "This coupon is no longer valid.");
    failure.status = response.status >= 400 ? response.status : 422;
    failure.field = "coupon";
    throw failure;
  }
  return data;
}
function variantFor(product, item) {
  const variants = rowsOf(product.variants);
  if (!variants.length) return null;
  const size = norm(item.size);
  const colour = norm(item.color);
  return variants.find((v) => norm(v.size ?? v.size_name) === size && (!colour || norm(v.colour ?? v.color ?? v.colour_name) === colour)) ?? null;
}

async function cleanupDraft(id) {
  try { await dokaniSend("PUT", `/temporary/sales/${id}/destroy`, {}); } catch { /* best effort cleanup */ }
}

export async function POST(request) {
  let draftId = null;
  try {
    const shopperToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const shopper = await shopperCustomerId(shopperToken);
    if (!shopper) return NextResponse.json({ message: "Please sign in to place an order." }, { status: 401 });
    const { customerId, points: availablePoints } = shopper;

    const body = await request.json();
    const { form = {}, items = [], shipping = "standard", orderNo } = body;
    if (!cfg().branchId) return NextResponse.json({ message: "DOKANI_BRANCH_ID is not configured on the storefront server." }, { status: 503 });
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) return NextResponse.json({ message: "Your cart is empty or has too many items." }, { status: 422 });
    if (typeof orderNo !== "string" || !/^AVN-[0-9a-f-]{36}$/i.test(orderNo)) return NextResponse.json({ message: "Invalid order reference." }, { status: 422 });
    const phone = String(form.phone || "").replace(/[\s-]/g, "");
    if (String(form.name || "").trim().length < 3 || !/^(?:\+?88)?01[3-9]\d{8}$/.test(phone) || String(form.address || "").trim().length < 8 || !String(form.district || "").trim()) {
      return NextResponse.json({ message: "Enter a valid name, Bangladesh phone number and complete delivery address." }, { status: 422 });
    }
    if (!['standard', 'express'].includes(shipping) || !['cod', 'bkash', 'nagad', 'rocket', 'bank'].includes(String(form.method || 'cod'))) {
      return NextResponse.json({ message: "Invalid delivery or payment option." }, { status: 422 });
    }
    if (form.method !== "cod" && String(form.trx || "").trim().length < 6) return NextResponse.json({ message: "Enter the payment reference before placing the order." }, { status: 422 });

    const previous = await dokaniSend("GET", `/sales/storefront/${encodeURIComponent(orderNo)}`);
    if (previous.status === 200 && previous.data?.sale) {
      const sale = previous.data.sale;
      return NextResponse.json({ id: sale.id, invoice: sale.invoice, orderNo, total: Number(sale.final_amount), paymentStatus: sale.payment_status || "unpaid", address: sale.delivery_address || "" }, { headers: { "Cache-Control": "no-store" } });
    }

    const products = [];
    let subtotal = 0;
    for (const item of items) {
      const product = await getRawProduct(item.productId);
      if (!product) return NextResponse.json({ message: `Product ${item.productId} is no longer available.` }, { status: 422 });
      const variant = variantFor(product, item);
      if ((product.is_size || product.is_colour) && rowsOf(product.variants).length && !variant) {
        return NextResponse.json({ message: `The selected size or colour for ${product.name} is unavailable.` }, { status: 422 });
      }
      const basePrice = Number(variant?.shop_price ?? product.shop_price);
      const campaignDiscount = Number(product.campaign_discount_value) > 0;
      const price = campaignDiscount
        ? Math.max(0, Math.round(product.campaign_discount_type === "percentage" ? basePrice * (1 - Number(product.campaign_discount_value) / 100) : basePrice - Number(product.campaign_discount_value)))
        : basePrice;
      if (!Number.isFinite(price) || price < 0 || !Number.isInteger(Number(item.qty)) || Number(item.qty) < 1 || Number(item.qty) > 100) {
        return NextResponse.json({ message: `Invalid quantity or price for ${product.name}.` }, { status: 422 });
      }
      subtotal += price * Number(item.qty);
      products.push({ raw: product, variant, qty: Number(item.qty), price });
    }

    // Same numbers the shopper saw: they come from the storefront settings the owner edits (PUT /storefront/settings).
    const shopSettings = await getSettings();
    const deliveryResponse = await dokaniGet("/delivery/options", { city: form.district });
    const activeDeliveryOptions = rowsOf(deliveryResponse?.options).filter((option) => Number(option.status) === 1);
    let selectedDeliveryOption = null;
    if (activeDeliveryOptions.length && shipping !== "express") {
      selectedDeliveryOption = activeDeliveryOptions.find((option) => Number(option.id) === Number(form.delivery_option_id));
      if (!selectedDeliveryOption) throw new Error("Choose an available delivery option for your area.");
    }
    const delivery = shipping === "express"
      ? Number(shopSettings.expressFee)
      : selectedDeliveryOption
        ? Number(selectedDeliveryOption.charge)
        : (subtotal >= Number(shopSettings.freeDeliveryOver) ? 0 : Number(shopSettings.deliveryFee));
    const coupon = String(form.coupon || "").trim()
      ? await validateCoupon(shopperToken, String(form.coupon).trim(), subtotal)
      : null;
    const couponDiscount = Math.min(Number(coupon?.discount || 0), subtotal);
    const pointClaim = Number(form.point_claim || 0);
    if (!Number.isInteger(pointClaim) || pointClaim < 0) throw new Error("Enter a valid whole number of points.");
    const pointRate = Number(shopSettings.takaPerPoint ?? 0.1);
    const pointPercent = Math.min(100, Math.max(0, Number(shopSettings.maxPointsDiscountPercent ?? 50)));
    const pointCap = Math.min(subtotal * pointPercent / 100, Math.max(0, subtotal + delivery - couponDiscount));
    const maxPoints = pointRate > 0 ? Math.floor(pointCap / pointRate + 0.000001) : 0;
    if (pointClaim > 0 && (!shopSettings.pointRedemptionEnabled || pointClaim > availablePoints || pointClaim > maxPoints)) {
      throw new Error("The points balance or maximum redemption limit has changed. Update the points amount and try again.");
    }
    const pointDiscount = Math.round(pointClaim * pointRate * 100) / 100;
    const amount = subtotal + delivery - couponDiscount - pointDiscount;
    const started = await dokaniSend("POST", "/temporary/sales/new", { sale_type: 1, source: "web" });
    draftId = started.data?.data?.sale_id ?? started.data?.sale_id;
    if (started.status < 200 || started.status >= 300 || !draftId) throw new Error("Order was not placed: Dokani could not prepare the sale. Please try again; if this repeats, contact the shop.");

    for (const entry of products) {
      const p = entry.raw, v = entry.variant;
      const added = await dokaniSend("POST", "/temporary/sales/add-product", {
        sale_id: draftId, product_id: p.id, variant_id: v?.id ?? null,
        size_id: v?.size_id ?? null, colour_id: v?.colour_id ?? v?.color_id ?? null,
        quantity: entry.qty, sale_type: 1, source: "web", is_service: 0,
        exact_sale_price: entry.price,
        exact_buy_price: Number(v?.last_buy_price ?? v?.avg_buy_price ?? p.last_buy_price ?? p.avg_buy_price ?? 0),
        mrp: Number(v?.mrp ?? p.mrp ?? entry.price),
      });
      if (added.status < 200 || added.status >= 300) throw new Error(added.data?.message || `Could not add ${p.name} to the sale.`);
    }

    const stock = await dokaniSend("POST", "/temporary/sales/check-stock", { sale_id: draftId });
    if (stock.status < 200 || stock.status >= 300 || stock.data?.stock_ok === false) {
      throw new Error(stock.data?.short_items?.map((x) => `${x.name}: ${x.available} available`).join(", ") || stock.data?.message || "One or more items are out of stock.");
    }

    const dateParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "2-digit", year: "numeric" })
      .formatToParts(new Date()).reduce((parts, part) => { if (part.type !== "literal") parts[part.type] = part.value; return parts; }, {});
    // SaleApiController parses sale_date using d-m-Y.
    const today = `${dateParts.day}-${dateParts.month}-${dateParts.year}`;
    const payment = String(form.method || "cod").toLowerCase();
    const finalized = await dokaniSend("POST", "/sales", {
      id: draftId, sale_type: 1, customer_id: customerId,
      total_exact_sale_price: subtotal, final_amount: amount, round_amount: amount,
      discount: couponDiscount, discount_type: coupon?.discount_type || null, coupon_code: coupon?.code || undefined,
      point_claim: pointClaim, point_discount: pointDiscount, received: 0, payment_by: 1,
      sale_date: today, sold_by: undefined, source: "web", order_no: orderNo,
      order_status: "pending", delivery_address: `${form.address}, ${form.district}`,
      delivery_type: shipping === "express" ? "express" : "standard", delivery_charge: delivery, delivery_option_id: selectedDeliveryOption?.id, delivery_city: form.district,
      payment_method: payment, payment_status: payment === "cod" ? "unpaid" : "pending_verification",
      payment_ref: form.trx || null, note: form.note || null,
    });
    if (finalized.status < 200 || finalized.status >= 300 || !finalized.data?.sale) throw new Error(finalized.data?.message || "Dokani could not finalize the sale.");
    const sale = finalized.data.sale;
    draftId = null;
    return NextResponse.json({ id: sale.id, invoice: sale.invoice, orderNo, total: amount, paymentStatus: sale.payment_status || (payment === "cod" ? "unpaid" : "pending_verification"), address: `${form.address}, ${form.district}` }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (draftId) await cleanupDraft(draftId);
    const errorStatus = Number(error?.status);
    const status = errorStatus >= 400 && errorStatus < 600 ? errorStatus : 422;
    const message = error?.message || "Checkout failed.";
    const payload = error?.field === "coupon" ? { message, errors: { coupon: [message] } } : { message };
    return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
  }
}
