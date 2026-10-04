import Image from "next/image";
import Link from "next/link";

// Logo file from the Dokani zip (public/images/logo.png).
export default function Logo({ width = 170 }) {
  return (
    <Link href="/" aria-label="Dokani" className="inline-block">
      <Image src="/images/logo.png" alt="Dokani" width={width} height={Math.round(width * 0.37)} priority className="h-auto" style={{ width }} />
    </Link>
  );
}
