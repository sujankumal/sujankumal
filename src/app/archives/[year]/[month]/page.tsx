import CategoryButton from "@/components/Category/CategoryButton";
import DateTime from "@/components/DateTime/DateTime";
import NotFound from "@/components/Errors/NotFound";
import Sidebar from "@/components/Sidebar";
import UserLinkButton from "@/components/User/UserLinkButton";
import { MONTHS } from "@/constants/constants";

import { fetchArchivesByYearAndMonth, fetchPostCountYearMonthArray } from "@/services/data_access";
import { PostType } from "@/types/post";
import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";

async function Archives({params}:{params: {year:number, month:number}}) {
    const {year, month} = params;
    // console.log(year,month)
    const posts = await fetchArchivesByYearAndMonth(year, month);

    return (  
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 px-4 md:mx-8 md:col-span-3">
            {
                (posts.length !== 0)?
                posts.map((post:PostType, index)=>{
                    return <div key={index} className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-300">
                    <header className="mt-5 text-center">
                        <div className="block m-1 p-1">
                        <CategoryButton categories={post.categories}/>
                        </div>
                        <div className="mb-2">
                        <h2>
                            <Link href={"/articles/"+post.id} className="text-teal-600">{post.title}</Link>
                        </h2>
                        </div>
                    </header>
                    <div className="text-center">
                        <p>{post.description}</p>
                    </div>
                    <footer className="mt-5 text-center text-xs">
                        <div className="inline-flex justify-center mr-4">
                        <DateTime datetime={post.date}/>
                        </div>
                        <div className="inline-flex">
                        <UserLinkButton user={post.author}/>
                        </div>
                    </footer>
                </div>
                }):<NotFound/>
            }
            </div>
            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar/>
                </div>
            </aside>
        </main>
    );
}

export default Archives;


export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const year_month = await fetchPostCountYearMonthArray();

    // Generate an array of objects with the correct structure for static generation
    const paths = year_month.map((value) => ({
      year: value.year.toString(),
      month: value.month.toString(),
    }));
    // console.log("Paths ", paths);
    return paths;
  }

  export async function generateMetadata({params}:{params: {year:number, month:number}}, parent: ResolvingMetadata): Promise<Metadata>{
    const {year, month} = params;

    return  {
        title: `Archives | ${MONTHS[month-1]} ${year}` ,
        description: `This page provides concise summaries of key topics and links to related archives of ${MONTHS[month-1]} ${year} for further exploration.`,
        openGraph:{
          images:['/bird-1024x576-20.gif'],
          type:'website',
          url:'https://vercel.sujankumal.com.np/',
          siteName:'Er. Sujan Kumal | A Software Engineer',
          title: `Archives | ${MONTHS[month-1]} ${year}` ,
          description: `This page provides concise summaries of key topics and links to related archives of ${MONTHS[month-1]} ${year} for further exploration.`,
        },
        twitter:{
          card:'summary_large_image',
          creator:'@sujan_03_',
          site:'@sujan_03_',
          images:['/bird-1024x576-20.gif'],
          title: `Archives | ${MONTHS[month-1]} ${year}` ,
          description: `This page provides concise summaries of key topics and links to related archives of ${MONTHS[month-1]} ${year} for further exploration.`,
        },
        
      }
}