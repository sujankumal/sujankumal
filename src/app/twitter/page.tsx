import Sidebar from "@/components/Sidebar";
import { fetchTwitter } from "@/services/data_access";

export const revalidate = 10;

async function Twitter() {
    const social_twitter = await fetchTwitter().then((data)=>{
        return data.find((item)=>{
            return item.embed
        });
      });    
        
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 p-4 md:m-8 md:col-span-3 inline-flex justify-center">
                <div className="prose prose-stone prose-sm dark:prose-invert">
                    {
                     (social_twitter)?<div>{social_twitter.username}</div>:<div>Empty</div>
                     }
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

export default Twitter;