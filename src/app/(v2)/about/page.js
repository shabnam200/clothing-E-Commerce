import { redirect } from "next/navigation";
import { ROUTES } from "@/config/v2";

// Old URL: About Us now lives with the other footer pages.
export default function Page() {
  redirect(ROUTES.info("about"));
}
