import { redirect } from "next/navigation";

export default function Home() {
  // Server-side redirect to landing page
  redirect("/landing");
}
