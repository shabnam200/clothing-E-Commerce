import { NextResponse } from "next/server";
import { getProduct } from "@/lib/v2/catalogSource";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = await params;
  if (!/^\d+$/.test(String(id))) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  const query = request.nextUrl.searchParams;
  const groupingMode = ["gender", "category", "hidden"].includes(query.get("mode")) ? query.get("mode") : "category";
  try {
    const item = await getProduct(id, query.get("lang") || "bn", groupingMode);
    return item ? NextResponse.json({ item }) : NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (error) {
    console.error(`[storefront] Product ${id} lookup failed:`, error?.message || error);
    return NextResponse.json({ error: "Product service is temporarily unavailable" }, { status: 503 });
  }
}
