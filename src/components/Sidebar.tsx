import { MONTHS } from "@/constants/constants";
import { fetchArchivesDates, fetchCategories, fetchPostTitle } from "@/services/data_access";
import Link from "next/link";

export default async function Sidebar() {

    const recentPost = await fetchPostTitle();
    const archives = await fetchArchivesDates();
    const catogries = await fetchCategories();

    return (<>
        <div className="block">
            <section className=" block mb-5 pb-3 w-full overflow-auto">
                <div className="border-b-2 border-orange-600 mb-5">
                    <div className="bg-orange-600 text-white px-4 py-1 text-lg inline-block">Recent Posts</div>
                </div>
                <div className="max-h-80 overflow-auto scrollbar">
                    <ul className="pl-2">
                        {
                            recentPost.map(({ title, url }, index) => (
                                <li key={index} className="w-full inline-flex text-gray-400 border-b border-gray-300 my-1 py-1 before:content-['\00BB'] hover:text-orange-600">
                                    <Link href={'/articles/' + url} className="pl-2 inline-flex flex-col justify-center text-sm text-gray-800 dark:text-inherit hover:text-inherit">{title}</Link>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </section>
            <section className="mb-5 pb-3 w-full overflow-auto">
                <div className="border-b-2 border-orange-600 mb-5">
                    <div className="bg-orange-600 text-white px-4 py-1 text-lg inline-block">Archives</div>
                </div>
                <div className="max-h-80 overflow-auto scrollbar">
                    <ul className="pl-2">
                        {
                            archives.map(({ year, month }, index) => (
                                <li key={index} className="w-full inline-flex text-gray-400 border-b border-gray-300 my-1 py-1 before:content-['\1F5BF'] hover:text-orange-600">
                                    <Link href={'/archives/' + year + '/' + month} className="pl-2 inline-flex flex-col justify-center text-sm text-gray-800 dark:text-inherit hover:text-inherit">{MONTHS[month - 1]}  {year}</Link>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </section>
            <section className="mb-5 pb-3 w-full">
                <div className="border-b-2 border-orange-600 mb-5">
                    <div className="bg-orange-600 text-white px-4 py-1 text-lg inline-block">Categories</div>
                </div>
                <div className="max-h-80 overflow-auto scrollbar">
                    <ul className="pl-2">
                        {
                            catogries.map(({ id, name }, index) => (
                                <li key={index} className="w-full inline-flex text-gray-400 border-b border-gray-300 my-1 py-1 before:content-['\2756'] hover:text-orange-600">
                                    <Link href={'/categories/' + name} className="pl-2 inline-flex flex-col justify-center text-sm text-gray-800 dark:text-inherit hover:text-inherit">{name}</Link>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </section>
        </div>
    </>);
}
