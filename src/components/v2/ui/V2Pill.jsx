import Link from "next/link";
import { cx } from "@/lib/v2/format";

// Pill link: "solid" (dark), "light" (cream, for use on photos), "outline", "ghost" (outline on photos).
export default function V2Pill({ href, variant = "solid", className, children, ...rest }) {
  return <Link href={href} className={cx("v2-pill", `v2-pill--${variant}`, className)} {...rest}>{children}</Link>;
}
