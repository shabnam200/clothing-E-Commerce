import { redirect } from "next/navigation";

export default async function Page({ searchParams }) {
  const q = ((await searchParams)?.q ?? "").toString().slice(0, 80);
  redirect(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
}
