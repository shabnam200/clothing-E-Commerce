import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-4 text-muted">This page could not be found.</p>
      <Link href="/" className="mt-8 rounded-xl bg-accent px-6 py-3 font-semibold text-black">Back to home</Link>
    </section>
  );
}
