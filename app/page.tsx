import { redirect } from "next/navigation";

export default function Home() {
  // Server-side redirect to avoid client-side hydration issues
  redirect("/landing");
}
