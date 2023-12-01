import PaginationPost from "@/components/Pagination/pagnate-post";
import Sidebar from "@/components/Sidebar";

import { fetchArticles } from "@/services/data_access";
import { PostType } from "@/types/post";
import { Metadata } from "next";

const articles:Array<PostType> = await fetchArticles();    
  

export const metadata: Metadata = {
    title: 'Articles | Er. Sujan Kumal | A Software Engineer',
    description: "This page provides concise summaries of key topics and links to related articles for further exploration.",
    openGraph:{
      images:['/bird-1024x576-20.gif'],
      type:'website',
      url:'https://vercel.sujankumal.com.np/',
      siteName:'Er. Sujan Kumal | A Software Engineer',
      title:'Articles | Er. Sujan Kumal | A Software Engineer',
      description:"This page provides concise summaries of key topics and links to related articles for further exploration.",
    },
    twitter:{
      card:'summary_large_image',
      creator:'@sujan_03_',
      site:'@sujan_03_',
      images:['/bird-1024x576-20.gif'],
      title:'Articles | Er. Sujan Kumal | A Software Engineer',
      description:"This page provides concise summaries of key topics and links to related articles for further exploration.",
    },
  }

function Articles() {
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 p-4 md:m-8 md:col-span-3">
                <PaginationPost items={articles} pageSize={10} path={"/articles/"}/>
            </div>
            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar/>
                </div>
            </aside>
        </main>
     );
}

export default Articles;