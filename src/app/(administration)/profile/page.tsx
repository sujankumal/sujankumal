import { auth } from "@/services/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) return redirect('/log-in');

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                <h1 className="text-2xl font-bold mb-4 text-white">Profile</h1>
                <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white font-medium">{session.user.email}</p>
                </div>
                <div className="space-y-2 mt-4">
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="text-white font-medium">{session.user.name}</p>
                </div>
                <div className="space-y-2 mt-4">
                    <p className="text-gray-400 text-sm">Verified</p>
                    <p className="text-white font-medium">{session.user.verified === true ? "Yes" : "No"}</p>
                </div>
            </div>
        </div>
    );
}
