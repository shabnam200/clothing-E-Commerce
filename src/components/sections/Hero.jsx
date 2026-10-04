import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";
import Button from "@/components/ui/Button";

// Background images + heading style come from the zip's Hero section.
export default function Hero({ t }) {
  const h = t.hero;
  return (
    <section id="hero" className="relative flex items-center bg-cover bg-center" style={{ backgroundImage: "url('/images/hero-bg.png')" }}>
      <div className="absolute inset-0 hidden bg-cover bg-center dark:block" style={{ backgroundImage: "url('/images/hero-bg-dark.png')" }} aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div className="text-center lg:text-left">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm text-brand dark:text-accent">✦ {h.badge}</p>
          <h1 className="text-5xl font-bold leading-tight md:text-7xl">{h.line1} <span className="text-brand dark:text-accent">{h.line2}</span></h1>
          <p className="mt-6 text-lg text-muted md:text-[22px]"><span className="font-semibold text-ink">{h.brand}</span>{h.text}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button href="#new-arrivals">{h.cta1} <FiArrowRight aria-hidden="true" /></Button>
            <Button href="#collections" variant="dark">{h.cta2}</Button>
          </div>
          <dl className="mt-10 flex justify-center gap-10 lg:justify-start">
            {h.stats.map(([value, label]) => (
              <div key={label}><dd className="text-3xl font-bold text-brand dark:text-accent">{value}</dd><dt className="text-muted">{label}</dt></div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-200 shadow-xl">
            <Image src="/images/hero.png" alt={h.imgAlt} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute bottom-4 left-4 rounded-2xl bg-white px-4 py-2 text-black shadow-lg dark:bg-night dark:text-white">
            <p className="text-sm text-muted">{h.upTo}</p><p className="text-2xl font-bold text-sale">{h.off}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
