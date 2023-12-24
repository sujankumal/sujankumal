import { Metadata } from "next";
import { auth, signOut } from "../../../services/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOut";
import Image from "next/image";
import bird_100_100_20 from '/public/bird-100x100-20.gif';

export const metadata: Metadata = {
    title: 'Admin | Er. Sujan Kumal | A Software Engineer',
    description: "Admin page.",
}

export const revalidate = 10;
async function Admin() {
    const session = await auth();
    console.log("Admin page .. :", session);
    if (!session?.user) {
        return redirect('/log-in');
    }
    return (
        <main className="min-h-screen justify-center">
            <nav className="bg-white border-b-2 border-gray-200 dark:bg-gray-900">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-1">
                    <div className="flex justify-center w-full md:w-fit border-b-2 border-teal-600 md:border-none">
                        <a href="/" className="space-x-3 rtl:space-x-reverse md:flex">
                            <div className="w-full md:w-fit inline-flex justify-center md:block">
                                <Image
                                    src={bird_100_100_20}
                                    alt="Er. Sujan Kumal"
                                    priority={true} 
                                />
                            </div>
                            <div className="self-center text-xl font-semibold whitespace-nowrap dark:text-white mb-4 md:m-auto">Er. Sujan Kumal</div>
                        </a>
                    </div>
                    <div className="w-full md:w-auto">
                        <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0">
                            <li className="inline-flex flex-col justify-center">
                                <span className="inline-flex justify-center py-2 px-3 rounded md:bg-transparent md:text-teal-600 md:p-0 dark:text-white md:dark:text-teal-600" aria-current="page">
                                    <p className="">Hello, { session?.user?.name ?? "Unknown" }. </p>
                                </span>
                            </li>
                            <li className="inline-flex flex-col justify-center">
                                <span className="inline-flex justify-center py-2 px-3 text-teal-600 rounded hover:bg-teal-600 md:hover:shadow-sm md:hover:text-teal-900 md:border-0 md:p-0 dark:text-white md:dark:hover:text-teal-600 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"><SignOutButton /></span>
                            </li>
                            
                        </ul>
                    </div>
                </div>
            </nav>
        </main>
    );
}

export default Admin;