import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaYoutube } from "react-icons/fa";
import { CREDIT_URL, NAV_LINKS, SOCIALS } from "@/config/site";
import Logo from "@/components/ui/Logo";

const ICONS = { facebook: FaFacebookF, youtube: FaYoutube };

// Same layout as the zip footer: bg image + overlay, centred logo, tagline, socials, credit.
export default function Footer({ t, lang }) {
  const f = t.footer;
  return (
    <footer className="relative overflow-hidden p-10">
      <Image src="/images/footer-bg.png" alt="" fill sizes="100vw" className="object-cover" aria-hidden="true" />
      <div className="absolute inset-0 bg-white/30 dark:bg-night/70" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center text-gray-600 dark:text-[#d1d5d5]">
        <div className="mb-4 flex justify-center"><Logo width={200} /></div>
        <p className="mb-3">{f.tagline}</p>
        <nav aria-label={f.nav} className="mb-3">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            {NAV_LINKS.map(({ key, href }) => <li key={key}><Link href={href} className="hover:text-brand dark:hover:text-accent">{t.nav[key]}</Link></li>)}
          </ul>
        </nav>
        <ul className="mb-3 flex justify-center gap-3">
          {SOCIALS.map(({ name, href, icon }) => {
            const Icon = ICONS[icon];
            return <li key={name}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={name} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg transition hover:text-brand"><Icon /></a></li>;
          })}
        </ul>
        <p>{f.credit}<a href={CREDIT_URL} target="_blank" rel="noopener noreferrer" className="ml-1 text-brand hover:underline dark:text-accent">{f.company}</a></p>
        <p className="mt-1 text-sm">© {new Date().getFullYear()} Dokani. {f.rights}</p>
      </div>
    </footer>
  );
}
