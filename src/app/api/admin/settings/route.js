import { proxyAdminRequest } from "../_lib/backend";

export const dynamic = "force-dynamic";
export async function GET(request) {
  return proxyAdminRequest(request, "/settings");
}
export async function PUT(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ message: "Invalid settings payload." }, { status: 422 });
  }
  return proxyAdminRequest(request, "/storefront/settings", { method: "PUT", body });
}
