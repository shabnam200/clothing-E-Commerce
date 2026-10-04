import Link from "next/link";
import { cn } from "@/lib/cn";

// Zip hero buttons: yellow / black(dark:white), rounded-lg, hover scale.
const VARIANTS = { primary: "bg-accent text-black", dark: "bg-black text-white dark:bg-white dark:text-black" };

export default function Button({ href, variant = "primary", className, children }) {
  return (
    <Link href={href} className={cn("flex h-[46px] min-w-[165px] items-center justify-center gap-2 rounded-lg px-5 text-lg transition duration-300 hover:scale-105 md:h-12 md:min-w-[180px]", VARIANTS[variant], className)}>
      {children}
    </Link>
  );
}
