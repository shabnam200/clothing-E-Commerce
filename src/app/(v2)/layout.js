import localFont from "next/font/local";
import Script from "next/script";
import "@/app/globals.css";
import "@/styles/v2-colors.css"; // ALL colors live here
import "@/styles/v2-campaign.css";
import "@/styles/v2-admin.css";
import "@/styles/v2-auth.css";
import V2Header from "@/components/v2/layout/V2Header";
import V2Footer from "@/components/v2/layout/V2Footer";
import V2Motion from "@/components/v2/ui/V2Motion";
import V2CartDrawer from "@/components/v2/cart/V2CartDrawer";
import V2StoreProvider from "@/components/v2/store/V2StoreProvider";
import { getV2Locale } from "@/lib/v2/i18n";
import { BRAND } from "@/config/v2";
import { getActiveCampaign, getStorefrontCreative } from "@/lib/v2/campaigns";
import { getCatalog } from "@/lib/v2/catalogSource";
import { getSettings } from "@/lib/v2/settings";

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

// Apply each saved palette only when it is complete and readable. The admin
// editor saves these fields directly; there is no separate enable flag.
const HEX = /^#[0-9a-f]{6}$/i;
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
function readableTheme(m = {}) {
  const keys = ['bg', 'surface', 'ink', 'muted', 'line', 'accent', 'button_bg', 'button_fg'];
  if (!keys.every((key) => typeof m[key] === 'string' && HEX.test(m[key]))) return false;
  return contrast(m.ink, m.bg) >= 4.5 && contrast(m.ink, m.surface) >= 4.5 && contrast(m.muted, m.bg) >= 3
    && contrast(m.button_fg, m.button_bg) >= 4.5 && contrast(m.accent, m.bg) >= 3;
}
function appearanceStyle(appearance = {}) {
  const style = {};
  const vars = { bg: 'bg', surface: 'surface', ink: 'ink', muted: 'muted', line: 'line', accent: 'sale', button_bg: 'btn-bg', button_fg: 'btn-fg' };
  for (const mode of ['light', 'dark']) {
    const palette = appearance?.[mode];
    if (!readableTheme(palette)) continue;
    for (const [key, token] of Object.entries(vars)) style[`--v2-theme-${mode}-${token}`] = palette[key];

    // The palette editor has no separate controls for tertiary surfaces. Tint
    // those surfaces from the saved page/surface/border colors so sections,
    // promo panels and the footer follow the selected theme too.
    style[`--v2-theme-${mode}-sand`] = `color-mix(in srgb, ${palette.bg} 65%, ${palette.line} 35%)`;
    style[`--v2-theme-${mode}-beige`] = palette.line;
    style[`--v2-theme-${mode}-tint-1`] = `color-mix(in srgb, ${palette.bg} 85%, ${palette.surface} 15%)`;
    style[`--v2-theme-${mode}-tint-2`] = `color-mix(in srgb, ${palette.bg} 65%, ${palette.surface} 35%)`;
    style[`--v2-theme-${mode}-tint-3`] = `color-mix(in srgb, ${palette.bg} 45%, ${palette.surface} 55%)`;
    style[`--v2-theme-${mode}-brown`] = palette.accent;
    style[`--v2-theme-${mode}-focus`] = palette.accent;
    style[`--v2-theme-${mode}-footer`] = `color-mix(in srgb, ${palette.bg} 85%, ${palette.line} 15%)`;
    style[`--v2-theme-${mode}-footer-line`] = palette.line;
  }
  if (appearance?.fonts?.heading === 'georgia') style['--v2-font-serif'] = "Georgia, 'Times New Roman', serif";
  if (appearance?.fonts?.body === 'arial') style['--v2-font-sans'] = "Arial, 'Helvetica Neue', sans-serif";
  if (appearance?.fonts?.body === 'trebuchet') style['--v2-font-sans'] = "'Trebuchet MS', sans-serif";
  return style;
}
export async function generateMetadata() {
  const [{ lang }, settings] = await Promise.all([getV2Locale(), getSettings()]);
  const brandName = lang === "bn" && settings.brandNameBn ? settings.brandNameBn : settings.brandNameEn || BRAND.name;
  const seo = settings.seo?.[lang] || {};
  const seoKeywords = String(seo.keywords || "").split(",").map((keyword) => keyword.trim()).filter(Boolean);
  return {
    title: { absolute: lang === "en" ? `${brandName} — Premium unisex fashion` : `${brandName} — প্রিমিয়াম ইউনিসেক্স ফ্যাশন` },
    description: lang === "en" ? "Considered essentials in premium fabrics, for every moment." : "প্রিমিয়াম কাপড়ে যত্নে তৈরি প্রতিদিনের পোশাক।",
    icons: { icon: settings.faviconUrl || "/avenor-default-icon.svg", shortcut: settings.faviconUrl || "/avenor-default-icon.svg" },
    ...(seo.title?.trim() ? { title: { absolute: seo.title.trim() } } : {}),
    ...(seo.description?.trim() ? { description: seo.description.trim() } : {}),
    ...(seoKeywords.length ? { keywords: seoKeywords } : {}),
    openGraph: { ...(seo.title?.trim() ? { title: seo.title.trim() } : {}), ...(seo.description?.trim() ? { description: seo.description.trim() } : {}), ...(settings.seo?.og_image ? { images: [settings.seo.og_image] } : {}) },
  };
}

export default async function V2Layout({ children }) {
  const { v2, lang, languageMode } = await getV2Locale();
  const [campaign, catalog, settings, creative] = await Promise.all([getActiveCampaign(lang), getCatalog(lang), getSettings(), getStorefrontCreative(lang)]);
  return (
    <html lang={lang} suppressHydrationWarning style={appearanceStyle(settings.appearance)}>
      <head>
        <Script
          id="avenor-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var theme=sessionStorage.getItem('avenor-theme');if(theme!=='dark'&&theme!=='light'){theme=localStorage.getItem('avenor-theme');}if(theme==='dark'||theme==='light'){document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.style.colorScheme=theme;}}catch(_){}})();`,
          }}
        />
      </head>
      <body>
        <div className={`v2 ${serif.variable} ${sans.variable} ${bnSerif.variable} ${bnSans.variable}`} data-campaign={campaign?.theme} style={appearanceStyle(settings.appearance)}>
          <V2StoreProvider v2={v2} lang={lang} catalog={catalog} settings={settings}>
            <a href="#v2-main" className="v2-skip">{v2.skip}</a>
            <V2Header v2={v2} lang={lang} languageMode={languageMode} settings={settings} campaign={campaign} offer={creative.offer} />
            <main id="v2-main">{children}</main>
            <V2Footer v2={v2} settings={settings} lang={lang} />
            {settings.featureToggles?.mini_cart !== false && <V2CartDrawer copy={{ ...v2.cart, payments: v2.footer.payments }} />}
            <V2Motion />
          </V2StoreProvider>
        </div>
      </body>
    </html>
  );
}
