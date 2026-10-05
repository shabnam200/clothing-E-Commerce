import Link from "next/link";
import { cn } from "@/lib/cn";

export default function V2Button({ href, variant = "solid", className, children }) {
  return <Link href={href} className={cn("v2-btn", `v2-btn--${variant}`, className)}>{children}</Link>;
}
