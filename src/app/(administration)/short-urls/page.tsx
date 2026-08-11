import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/services/auth";
import ShortUrlsManager from "./short-urls-manager";

export const metadata: Metadata = {
  title: "Short URLs | Sujan Kumal | Software Engineer",
  description: "Manage Cloudflare short URLs.",
};

export const instant = false;

export default async function ShortUrlsPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/log-in");
  }

  if (!session.user.verified) {
    return redirect("/not-authorized");
  }

  return <ShortUrlsManager />;
}
