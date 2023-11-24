import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import { fetchAbout } from "@/services/data_access";
import { PostType } from "@/types/post";

const about:Array<PostType> = await fetchAbout().then((data)=>{
    // console.log("Post ABOUT: ",data);
    return data;
  });    
const mds = about.slice(-1)[0]?.content?.map((content, index)=>{
    // console.log(content, "cont");
    return (content.content)?<MarkdownComponent key={index} content={content.content} />:<div></div>;
});

function About() {
    
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