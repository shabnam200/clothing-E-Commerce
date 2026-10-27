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
  return Number(context.customer_id);
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
    const customerId = await shopperCustomerId(shopperToken);
    if (!customerId) return NextResponse.json({ message: "Please sign in to place an order." }, { status: 401 });

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
    if (form.coupon) return NextResponse.json({ message: "Coupon checkout is not connected to Dokani yet. Remove the coupon and retry." }, { status: 422 });

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
      const price = Number(variant?.shop_price ?? product.shop_price);
      if (!Number.isFinite(price) || price < 0 || !Number.isInteger(Number(item.qty)) || Number(item.qty) < 1 || Number(item.qty) > 100) {
        return NextResponse.json({ message: `Invalid quantity or price for ${product.name}.` }, { status: 422 });
      }
      subtotal += price * Number(item.qty);
      products.push({ raw: product, variant, qty: Number(item.qty), price });
    }

    // Same numbers the shopper saw: they come from the storefront settings the owner edits (PUT /storefront/settings).
    const shopSettings = await getSettings();
    const delivery = shipping === "express"
      ? Number(shopSettings.expressFee)
      : (subtotal >= Number(shopSettings.freeDeliveryOver) ? 0 : Number(shopSettings.deliveryFee));
    const amount = subtotal + delivery;
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
      discount: 0, discount_type: null, received: 0, payment_by: 1,
      sale_date: today, sold_by: undefined, source: "web", order_no: orderNo,
      order_status: "pending", delivery_address: `${form.address}, ${form.district}`,
      delivery_type: shipping === "express" ? "express" : "standard", delivery_charge: delivery,
      payment_method: payment, payment_status: payment === "cod" ? "unpaid" : "pending_verification",
      payment_ref: form.trx || null, note: form.note || null,
    });
    if (finalized.status < 200 || finalized.status >= 300 || !finalized.data?.sale) throw new Error(finalized.data?.message || "Dokani could not finalize the sale.");
    const sale = finalized.data.sale;
    draftId = null;
    return NextResponse.json({ id: sale.id, invoice: sale.invoice, orderNo, total: amount, paymentStatus: sale.payment_status || (payment === "cod" ? "unpaid" : "pending_verification"), address: `${form.address}, ${form.district}` }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (draftId) await cleanupDraft(draftId);
    const status = error?.status === 401 || error?.status === 403 ? error.status : 422;
    return NextResponse.json({ message: error?.message || "Checkout failed." }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
