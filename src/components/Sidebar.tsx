import { MONTHS } from "@/constants/config";
import { fetchArchivesDates, fetchCategories, fetchPostTitle } from "@/services/data_access";
import { CatergoryType } from "@/types/category";
import { PostType } from "@/types/post";
import Link from "next/link";

const recentPost: Array<PostType> = await fetchPostTitle();

// const archives = [
//     {name:"July 2020", url:"/archives/2020/7"},
//     {name:"August 2020", url:"/archives/2020/8"},
//     {name:"September 2020", url:"/archives/2020/9"},
//     {name:"October 20202", url:"/archives/2020/10"},
// ]
const archives = await fetchArchivesDates();

const catogries: Array<CatergoryType> = await fetchCategories();

function Sidebar() {
    return ( <>
        <div className="block">
            <section className=" block mb-5 pb-3 w-full overflow-auto">
                <div className="border-b-2 border-teal-600 mb-5">
                    <div className="bg-teal-600 text-white px-4 py-1 text-lg inline-block">Recent Posts</div>
                </div>
                <div className="max-h-80 overflow-auto scrollbar">
                    <ul className="list-outside pl-5">
                        {
                            recentPost.map(({id, title}, index)=>(
                            <li key={index} className="text-gray-400 border-b border-gray-300 my-1 py-1 before:content-['\00BB'] hover:text-teal-600">
                                <Link href={'/articles/'+id} className="pl-2 text-sm text-gray-800 dark:text-inherit hover:text-inherit">{title}</Link>
                            </li>
                            ))
                        }
                    </ul>
                </div>
            </section>
            <section className="mb-5 pb-3 w-full overflow-auto">
                <div className="border-b-2 border-teal-600 mb-5">
                    <div className="bg-teal-600 text-white px-4 py-1 text-lg inline-block">Archives</div>
                </div>
                <div className="max-h-80 overflow-auto scrollbar">
                    <ul className="list-outside pl-5">
                        {
                            archives.map(({year, month}, index)=>(
                            <li key={index} className="text-gray-400 border-b border-gray-300 my-1 py-1 before:content-['\1F5BF'] hover:text-teal-600">
                                <Link href={'/archives/'+year+'/'+month} className="pl-2 text-sm text-gray-800 dark:text-inherit hover:text-inherit">{ MONTHS[month] }  { year }</Link>
                            </li>
                            ))
                        }
                    </ul>
                </div>
            </section>
            <section className="mb-5 pb-3 w-full">
                <div className="border-b-2 border-teal-600 mb-5">
                    <div className="bg-teal-600 text-white px-4 py-1 text-lg inline-block">Categories</div>
                </div>
                <div className="max-h-80 overflow-auto scrollbar">
                    <ul className="list-outside pl-5">
                        {
                            catogries.map(({id, name}, index)=>(
                            <li key={index} className="text-gray-400 border-b border-gray-300 my-1 py-1 before:content-['\2756'] hover:text-teal-600">
                                <Link href={'/categories/'+id} className="pl-2 text-sm text-gray-800 dark:text-inherit hover:text-inherit">{name}</Link>
                            </li>
                            ))
                        }
                    </ul>
                </div>
            </section>
        </div>
    </> );
}

export default Sidebar;