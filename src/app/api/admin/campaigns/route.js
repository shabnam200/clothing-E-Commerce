import { proxyAdminRequest } from "../_lib/backend";

export const dynamic = "force-dynamic";
export async function GET(request) {
  return proxyAdminRequest(request, "/storefront/campaigns/manage");
}
export async function POST(request) {
  const body = await request.formData().catch(() => null);
  if (!body) return Response.json({ message: "Invalid campaign payload." }, { status: 422 });
  return proxyAdminRequest(request, "/storefront/campaigns", { method: "POST", body });
}
