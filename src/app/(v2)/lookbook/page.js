import { redirect } from "next/navigation";
import { ROUTES } from "@/config/v2";

// Lookbook is now a section of the landing page (after Our Picks). Keep old /lookbook links working.
export default function LookbookPage() {
  redirect(ROUTES.lookbook);
}
