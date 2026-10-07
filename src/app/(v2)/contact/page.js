import { redirect } from "next/navigation";

// Short, memorable URL that forwards to the real page (keeps one source of truth per page).
export default function Page() {
  redirect("/info/contact");
}
