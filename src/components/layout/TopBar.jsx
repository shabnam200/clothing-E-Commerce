import { FiMapPin, FiTruck } from "react-icons/fi";
import { SITE } from "@/config/site";
import { formatPrice } from "@/lib/format";

export default function TopBar({ t, lang }) {
  return (
    <div className="bg-night text-sm text-white/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
        <p className="flex items-center gap-2"><FiTruck className="text-accent" aria-hidden="true" />{t.topbar.delivery(formatPrice(SITE.freeDeliveryOver, lang))}</p>
        <label className="hidden items-center gap-2 sm:flex">
          <FiMapPin className="text-accent" aria-hidden="true" />{t.topbar.stock}
          <select className="rounded-full border border-white/20 bg-transparent px-3 py-1 text-white">
            {t.branches.map((b) => <option key={b} className="text-black">{b}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
