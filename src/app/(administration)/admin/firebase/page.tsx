import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/authorization";
import FirebaseManager from "./firebase-manager";

export const metadata: Metadata = {
  title: "Firebase Manager | Sujan Kumal | Software Engineer",
  description: "Securely explore and manage Firebase Realtime Database data.",
};

export const instant = false;

export default async function FirebasePage() {
  const user = await getCurrentUser();
  if (!user) {
    return redirect("/log-in");
  }
  if (!user.verified) {
    return redirect("/not-authorized");
  }

  return <FirebaseManager />;
}
