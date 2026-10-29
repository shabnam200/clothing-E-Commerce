import { proxyAdminRequest } from "../_lib/backend";

export const dynamic = "force-dynamic";
export async function GET(request) {
  return proxyAdminRequest(request, "/storefront/campaign-products");
}
