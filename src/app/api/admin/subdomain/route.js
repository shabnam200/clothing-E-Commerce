import { proxyAdminRequest } from "../_lib/backend";

export const dynamic = "force-dynamic";
export async function GET(request) {
  return proxyAdminRequest(request, "/storefront/subdomain");
}
export async function PUT(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.subdomain !== "string") {
    return Response.json({ message: "A subdomain is required." }, { status: 422 });
  }
  return proxyAdminRequest(request, "/storefront/subdomain", { method: "PUT", body });
}
