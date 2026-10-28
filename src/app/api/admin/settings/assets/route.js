import { proxyAdminRequest } from "../../_lib/backend";
import { getAdminAccessToken } from "@/services/dokani/adminSession";
import { isSameOrigin } from "@/services/adminAuthCore";

export const dynamic = "force-dynamic";

const assetTypes = new Set(["site_logo", "favicon", "brand_logo", "info_page_image"]);

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ message: "Request rejected." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!(await getAdminAccessToken())) return Response.json({ message: "Not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const body = await request.formData().catch(() => null);
  const type = body?.get("type");
  const pageSlug = body?.get("page_slug");
  const asset = body?.get("asset");
  if (!body || !assetTypes.has(type) || (type === "info_page_image" && pageSlug !== "about") || !(asset instanceof File) || asset.size === 0 || asset.size > 5 * 1024 * 1024) {
    return Response.json({ message: "Choose a valid image under 5 MB." }, { status: 422 });
  }
  return proxyAdminRequest(request, "/storefront/settings/assets", { method: "POST", body });
}
