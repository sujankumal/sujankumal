
import { auth } from "../../../services/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOut";

export default async function NotAuthorized() {
    const session = await auth();
    if (!session?.user) {
        return redirect('/log-in');
    }
    if (session?.user.verified) {
        return redirect('/admin');
    }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Not Authorized</h1>
        <p className="mb-6">You do not have permission to access this page.</p>
        <div className="text-teal-600 hover:underline">
            <span className="inline-flex justify-center md:py-2 px-2 text-teal-600 rounded hover:bg-teal-600 md:hover:shadow-sm md:hover:text-teal-900 md:border-0 md:p-0 dark:text-white md:dark:hover:text-teal-600 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"><SignOutButton /></span>
        </div>
      </div>
    </main>
  );
}