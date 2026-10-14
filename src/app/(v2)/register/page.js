import V2AuthRoute from "@/components/v2/account/V2AuthRoute";
import { getV2Locale } from "@/lib/v2/i18n";

export async function generateMetadata() {
  const { v2 } = await getV2Locale();
  return { title: { absolute: `${v2.auth.registerTitle} — AVENOR` } };
}

// The form itself lives in the popup (V2AuthModal); this route just opens it.
export default async function RegisterPage() {
  const { v2 } = await getV2Locale();
  return <V2AuthRoute mode="register" copy={v2.auth} />;
}
