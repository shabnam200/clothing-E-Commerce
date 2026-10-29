import { NextResponse } from "next/server";
import { cfg } from "@/services/dokani/config";
import { getAdminAccessToken } from "@/services/dokani/adminSession";
import { isSameOrigin } from "@/services/adminAuthCore";

export async function proxyAdminRequest(request, path, { method = "GET", body } = {}) {
  if (method !== "GET" && !isSameOrigin(request)) {
    return NextResponse.json({ message: "Request rejected." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const token = await getAdminAccessToken({ fresh: method !== "GET" });
  if (!token) return NextResponse.json({ message: "Not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const { baseUrl } = cfg();
  if (!baseUrl) return NextResponse.json({ message: "Website control is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
    let requestBody = body;
    if (body && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
    const upstream = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: method === "GET" || method === "DELETE" ? undefined : requestBody,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "Cache-Control": "no-store", "Content-Type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    console.error("[admin-control] backend request failed", error?.message || error);
    return NextResponse.json({ message: "Website control is temporarily unavailable." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}