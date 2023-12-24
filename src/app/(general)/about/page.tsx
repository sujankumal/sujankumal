import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import { fetchAbout } from "@/services/data_access";
import { PostType } from "@/types/post";
import { Metadata } from "next";

const about_:Array<PostType> = await fetchAbout();    
const main_image:string = about_.slice(-1)[0].main_image;

export const metadata: Metadata = {
    title: 'About | Er. Sujan Kumal | A Software Engineer',
    description: "I'm Sujan Kumal, a software engineer with a strong passion for creating innovative solutions and exploring the world of technology. Here's a little bit about me:",
    openGraph:{
      images:[`/images/${main_image}`],
      type:'website',
      url:'https://vercel.sujankumal.com.np/',
      siteName:'Er. Sujan Kumal | A Software Engineer',
      title:'About | Er. Sujan Kumal | A Software Engineer',
      description:"I'm Sujan Kumal, a software engineer with a strong passion for creating innovative solutions and exploring the world of technology. Here's a little bit about me:",
    },
    twitter:{
      card:'summary_large_image',
      creator:'@sujan_03_',
      site:'@sujan_03_',
      images:[`/images/${main_image}`],
      title:'About | Er. Sujan Kumal | A Software Engineer',
      description:"I'm Sujan Kumal, a software engineer with a strong passion for creating innovative solutions and exploring the world of technology. Here's a little bit about me:",
    },
  }
  
export const revalidate = 10;

async function About() {
    
    const about:Array<PostType> = await fetchAbout();    
    const mds = about.slice(-1)[0]?.content?.map((content, index)=>{
        return (content.content)?<MarkdownComponent key={index} content={content.content} />:<div></div>;
    });

    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 p-4 md:m-8 md:col-span-3 inline-flex justify-center">
                <div className="prose prose-stone prose-sm dark:prose-invert">
                    { mds }
                </div>
            </div>
            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar/>
                </div>
            </aside>
        </main>
     );
}

export default About;