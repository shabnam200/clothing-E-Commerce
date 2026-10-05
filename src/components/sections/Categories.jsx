import RemoteImage from "@/components/ui/RemoteImage";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { CATEGORIES } from "@/data/categories";
import { formatNumber } from "@/lib/format";

// Card style from the zip's OurServices: rounded-2xl, shadow, #f2fbff / #002e48 hover.
export default function Categories({ t, lang }) {
  const c = t.categories;
  return (
    <section id="collections" className="bg-page py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading eyebrow={c.eyebrow} title={c.title} highlight={c.highlight} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(({ key, styles, image }) => (
            <li key={key}>
              <Link href="/#new-arrivals" className="group block h-full overflow-hidden rounded-2xl bg-card shadow-md transition hover:bg-[#f2fbff] hover:shadow-xl dark:hover:bg-night">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-200">
                  <RemoteImage src={image} alt={c.names[key]} sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="py-5 text-center">
                  <h3 className="text-2xl font-bold text-ink dark:text-brand">{c.names[key]}</h3>
                  <p className="text-muted">{formatNumber(styles, lang)} {c.styles}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
