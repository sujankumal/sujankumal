
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOut";
import { getCurrentUser } from "@/services/authorization";

export const instant = false;

export default async function NotAuthorized() {
  const user = await getCurrentUser();
  if (!user) {
    return redirect('/log-in');
  }
  if (user.verified) {
    return redirect('/admin');
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Not Authorized</h1>
        <p className="mb-6">You do not have permission to access this page.</p>
        <div className="text-orange-600 hover:underline">
          <SignOutButton className="text-sm justify-center flex w-full items-center gap-2 p-2 hover:bg-red-500/10 rounded-lg cursor-pointer " />
        </div>
      </div>
    </main>
  );
}