import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/authorization";
import ShortUrlsManager from "./short-urls-manager";

export const metadata: Metadata = {
  title: "Short URLs | Sujan Kumal | Software Engineer",
  description: "Manage Cloudflare short URLs.",
};

export const instant = false;

export default async function ShortUrlsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return redirect("/log-in");
  }
  if (!user.verified) {
    return redirect("/not-authorized");
  }

  return <ShortUrlsManager />;
}
