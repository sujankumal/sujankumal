import Link from "next/link";

const recentPost = [
    {name:"श्री शिव महिम्नः स्तोत्रं।", url:"/articles/1"},
    {name:"3 Eggs and 3 Lessons", url:"/articles/2"},
    {name:"Achyutam Keshavam", url:"/articles/3"},
    {name:"मीठे रस से भरी रे राधा रानी लागे", url:"/articles/4"},
]
const archives = [
    {name:"July 2020", url:"/archives/2020/7"},
    {name:"August 2020", url:"/archives/2020/8"},
    {name:"September 2020", url:"/archives/2020/9"},
    {name:"October 20202", url:"/archives/2020/10"},
]
const catogries = [
    {name:"Bhajan", url:"/category/bhanjan"},
    {name:"Lesson", url:"/category/lesson"},
    {name:"Song", url:"/category/song"},
    {name:"Joke", url:"/category/joke"},
    {name:"Uncategorized", url:"/category/uncategorized"},
]
function Sidebar() {
    return ( <>
        <div className="block">
            <section className=" block mb-5 pb-3 w-full">
                <div className="border-b-2 border-teal-600 mb-5">
                    <div className="bg-teal-600 text-white px-4 py-1 text-lg inline-block">Recent Posts</div>
                </div>
                <ul className="list-outside pl-5">
                    {
                        recentPost.map(({name,url}, index)=>(
                        <li key={index} className="text-gray-400 border-b border-gray-300 my-1 py-1 before:content-['\00BB'] hover:text-teal-600">
                            <Link href={url} className="pl-2 text-sm text-gray-800 dark:text-inherit hover:text-inherit">{name}</Link>
                        </li>
                        ))
                    }
                </ul>
            </section>
            <section className="mb-5 pb-3 w-full">
                <div className="border-b-2 border-teal-600 mb-5">
                    <div className="bg-teal-600 text-white px-4 py-1 text-lg inline-block">Archives</div>
                </div>
                <ul className="list-outside pl-5">
                    {
                        archives.map(({name,url}, index)=>(
                        <li key={index} className="text-gray-400 border-b border-gray-300 my-1 py-1 before:content-['\1F5BF'] hover:text-teal-600">
                            <Link href={url} className="pl-2 text-sm text-gray-800 dark:text-inherit hover:text-inherit">{name}</Link>
                        </li>
                        ))
                    }
                </ul>
            </section>
            <section className="mb-5 pb-3 w-full">
                <div className="border-b-2 border-teal-600 mb-5">
                    <div className="bg-teal-600 text-white px-4 py-1 text-lg inline-block">Categories</div>
                </div>
                <ul className="list-outside pl-5">
                    {
                        catogries.map(({name,url}, index)=>(
                        <li key={index} className="text-gray-400 border-b border-gray-300 my-1 py-1 before:content-['\2756'] hover:text-teal-600">
                            <Link href={url} className="pl-2 text-sm text-gray-800 dark:text-inherit hover:text-inherit">{name}</Link>
                        </li>
                        ))
                    }
                </ul>
            </section>
        </div>
    </> );
}

export default Sidebar;