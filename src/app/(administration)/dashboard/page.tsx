import { auth } from "@/services/auth";
import { redirect } from "next/navigation";

export const instant = false;

export default async function AdminPage() {
    const session = await auth();
    if (!session?.user) return redirect('/log-in');

    return (
        <></>
    );
}
