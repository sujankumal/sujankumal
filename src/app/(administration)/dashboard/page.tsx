import { Metadata } from "next";
import { auth } from "../../../services/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOut";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: 'Dashboard | Sujan Kumal | Software Engineer',
    description: "Dashboard page.",
}

export const revalidate = 86400;
async function Admin() {
    const session = await auth();
    if (!session?.user) {
        return redirect('/log-in');
    }
    return (
        <main className="min-h-screen justify-center">
            <nav className=" border-b-2 border-gray-200">
                <div className="max-w-7xl flex flex-wrap items-center justify-between mx-auto p-1">
                    <div className="flex justify-center w-full md:w-fit border-b-2 border-orange-600 md:border-none">
                        <Link href="/" className="space-x-3 rtl:space-x-reverse md:flex">
                            <div className="w-full md:w-fit inline-flex justify-center md:block">
                                <Image
                                    src="/bird-100x100-20.gif"
                                    alt="Sujan Kumal"
                                    width={100}
                                    height={100}
                                    priority={true} 
                                />
                            </div>
                            <div className="self-center text-xl font-semibold whitespace-nowrap dark:text-white mb-2 md:m-auto text-orange-600 md:p-0 ">Sujan Kumal</div>
                        </Link>
                    </div>
                    <div className="w-full md:w-auto">
                        <ul className="font-medium flex flex-col p-1 md:p-0 mt-1 rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0">
                            <li className="inline-flex flex-col justify-center">
                                <span className="inline-flex justify-center md:py-2 px-3 rounded md:bg-transparent text-orange-600 md:p-0 dark:text-white md:dark:text-orange-600">
                                    <p className="inline-flex flex-col justify-center mx-2">Hello, { session?.user?.name ?? "Unknown" }. </p>
                                    {(session?.user.image)?
                                        <Image
                                            className="rounded-full"
                                            width={50}
                                            height={50}
                                            src={session?.user.image??''}
                                            alt={"User Image"}
                                            unoptimized
                                        />
                                    :null
                                    }    
                                </span>
                            </li>
                            {(session?.user.verified)?
                                <Link href="/admin" className="space-x-3 rtl:space-x-reverse md:flex">
                                    <li className="inline-flex flex-col justify-center md:py-2 px-3 rounded md:bg-transparent text-orange-600 md:p-0 dark:text-white md:dark:text-orange-600">Admin Page</li>
                                </Link>
                                :null
                            }
                            <li className="inline-flex flex-col justify-center">
                                <span className="inline-flex justify-center md:py-2 px-2 text-orange-600 rounded hover:bg-orange-600 md:hover:shadow-sm md:hover:text-orange-900 md:border-0 md:p-0 dark:text-white md:dark:hover:text-orange-600 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"><SignOutButton /></span>
                            </li>
                            
                        </ul>
                    </div>
                </div>
            </nav>
            <div className="w-full h-screen relative">
                <Image
                    src="/images/rockets/spacex--p-KCm6xB9I-unsplash.jpg"
                    alt="spacex rocker launch"
                    fill
                    className="object-cover -z-10"
                />
            </div>
        </main>
    );
}

export default Admin;