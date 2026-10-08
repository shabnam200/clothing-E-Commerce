import localFont from "next/font/local";
import "@/app/globals.css";
import "@/styles/v2-campaign.css";
import V2Header from "@/components/v2/layout/V2Header";
import V2Footer from "@/components/v2/layout/V2Footer";
import V2Motion from "@/components/v2/ui/V2Motion";
import V2CartDrawer from "@/components/v2/cart/V2CartDrawer";
import V2StoreProvider from "@/components/v2/store/V2StoreProvider";
import { getV2Locale } from "@/lib/v2/i18n";
import { BRAND } from "@/config/v2";
import { getActiveCampaign } from "@/lib/v2/campaigns";

const serif = localFont({
  src: [
    { path: "../../fonts/v2/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/v2/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--v2-font-serif", display: "swap",
});
const sans = localFont({ src: "../../fonts/v2/inter-latin-wght-normal.woff2", variable: "--v2-font-sans", weight: "100 900", display: "swap" });
const bnSerif = localFont({ src: "../../fonts/v2/noto-serif-bengali-bengali-500-normal.woff2", variable: "--v2-font-bnserif", weight: "500", display: "swap" });
const bnSans = localFont({
  src: [
    { path: "../../fonts/v2/hind-siliguri-bengali-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/v2/hind-siliguri-bengali-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/v2/hind-siliguri-bengali-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--v2-font-bn", display: "swap",
});

export async function generateMetadata() {
  const { lang } = await getV2Locale();
  return {
    title: { absolute: lang === "en" ? `${BRAND.name} — Premium unisex fashion` : `${BRAND.name} — প্রিমিয়াম ইউনিসেক্স ফ্যাশন` },
    description: lang === "en" ? "Considered essentials in premium fabrics, for every moment." : "প্রিমিয়াম কাপড়ে যত্নে তৈরি প্রতিদিনের পোশাক।",
  };
}

export default async function V2Layout({ children }) {
  const { v2, lang } = await getV2Locale();
  const campaign = await getActiveCampaign(lang);
  return (
    <html lang={lang} suppressHydrationWarning>
      <head />
      <body>
        <div className={`v2 ${serif.variable} ${sans.variable} ${bnSerif.variable} ${bnSans.variable}`} data-campaign={campaign?.theme}>
          <V2StoreProvider v2={v2} lang={lang}>
            <a href="#v2-main" className="v2-skip">{v2.skip}</a>
            <V2Header v2={v2} lang={lang} campaign={campaign} />
            <main id="v2-main">{children}</main>
            <V2Footer v2={v2} />
            <V2CartDrawer copy={{ ...v2.cart, payments: v2.footer.payments }} />
            <V2Motion />
          </V2StoreProvider>
        </div>
      </body>
    </html>
  );
}