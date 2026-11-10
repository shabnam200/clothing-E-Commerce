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
  // `domain` is the optional custom domain. Send it only when the page sent it: "" clears it, a missing key leaves it unchanged.
  const payload = { subdomain: body.subdomain };
  if (typeof body.domain === "string") payload.domain = body.domain;
  return proxyAdminRequest(request, "/storefront/subdomain", { method: "PUT", body: payload });
}
