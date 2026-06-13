import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/services/auth";
import FirebaseManager from "./firebase-manager";

export const metadata: Metadata = {
  title: "Firebase Manager | Sujan Kumal | Software Engineer",
  description: "Securely explore and manage Firebase Realtime Database data.",
};

export default async function FirebasePage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/log-in");
  }

  if (!session.user.verified) {
    return redirect("/not-authorized");
  }

  return <FirebaseManager />;
}
