import Sidebar from "@/components/Sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Updates | Er. Sujan Kumal | A Software Engineer',
    description: "This page provides latest news, events, updates etc.",
    openGraph:{
        images:['/bird-1024x576-20.gif'],
        type:'website',
        url:'https://vercel.sujankumal.com.np/',
        siteName:'Er. Sujan Kumal | A Software Engineer',
        title: 'Updates | Er. Sujan Kumal | A Software Engineer',
        description: "This page provides latest news, events, updates etc.",
    },
    twitter:{
        card:'summary_large_image',
        creator:'@sujan_03_',
        site:'@sujan_03_',
        images:['/bird-1024x576-20.gif'],
        title: 'Updates | Er. Sujan Kumal | A Software Engineer',
        description: "This page provides latest news, events, updates etc.",
    },
}

function Updates() {
    
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 p-4 md:m-8 md:col-span-3 inline-flex justify-center">
                <div className="text-lg">Updates</div>
                <div className="prose prose-stone prose-sm dark:prose-invert">
                   
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

export default Updates;