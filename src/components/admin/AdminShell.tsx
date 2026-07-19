import Image from "next/image";
import Link from "next/link";
import SignOutButton from "@/components/auth/SignOut";
import { fetchSite } from "@/services/data_access";
import { SiteType } from "@/types/site";
import { Session } from "next-auth";
import AdminNav from "./AdminNav";

export default async function AdminShell({ children, session }: { children: React.ReactNode, session: Session | null }) {

    const sites: SiteType = await fetchSite();
    return (
        <div className="min-h-screen w-full relative">
            {/* Background Image */}
            <div className="fixed inset-0 -z-10 bg-zinc-950">
                <Image
                    src="/images/rockets/spacex--p-KCm6xB9I-unsplash.jpg"
                    fill
                    className="object-cover opacity-40"
                    alt="Background"
                />
            </div>
            <AdminNav session={session} sites={sites} />

            {/* Main Content Container */}
            <main className="w-full mx-auto p-6">
                {children}
            </main>
        </div>
    );
}

