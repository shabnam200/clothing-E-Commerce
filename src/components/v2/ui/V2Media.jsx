import RemoteImage from "@/components/ui/RemoteImage";
import { existingImage } from "@/lib/v2/media";
import { cx } from "@/lib/v2/format";

// Photo from a remote URL (or a local /public file that exists), otherwise a plain tonal block. Never a broken image.
export default function V2Media({ src, alt, sizes, priority = false, position, className, children }) {
  const real = existingImage(src);
  return (
    <div className={cx("v2-media", className)} {...(real ? {} : { role: "img", "aria-label": alt })}>
      {real && <RemoteImage src={real} alt={alt} sizes={sizes} priority={priority} style={position ? { objectPosition: position } : undefined} />}
      {children}
    </div>
  );
}
