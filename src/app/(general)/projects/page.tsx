import Sidebar from "@/components/Sidebar";
import { fetchProjects } from "@/services/data_access";
import { ProjectType } from "@/types/project";
import { Metadata } from "next";
import { Noto_Sans_Mono } from "next/font/google";
import Link from "next/link";

export const metadata: Metadata = {
    title: 'Projects | Sujan Kumal | A Software Engineer',
    description: "See what we've accomplished: Browse our impressive portfolio of projects.",
    openGraph:{
        images:['/bird-1024x576-20.gif'],
        type:'website',
        url:'https://sujankumal.com.np/',
        siteName:'Sujan Kumal | A Software Engineer',
        title: 'Projects | Sujan Kumal | A Software Engineer',
        description: "See what we've accomplished: Browse our impressive portfolio of projects.",
    },
    twitter:{
        card:'summary',
        creator:'@sujan_03_',
        site:'@sujan_03_',
        images:['/bird-1024x576-20.gif'],
        title: 'Projects | Sujan Kumal | A Software Engineer',
        description: "See what we've accomplished: Browse our impressive portfolio of projects.",
    },
    robots: {
      index: true,
      follow: true,
    },
}
export const revalidate = 86400;

const noto_mono = Noto_Sans_Mono({
    subsets:['latin']
});

async function Projects() {
    const projects:ProjectType[] = await fetchProjects();    
    return (
        <main className={"grid md:grid-cols-4 min-h-screen justify-center" + noto_mono.className}>
            <div className="mb-8 p-4 md:m-8 md:col-span-3 inline-flex justify-center">
                <div className="max-w-none">
                    {
                        projects.map((proj, index)=>{
                            return <div className="mt-2 mb-5 pb-5 border-b border-dashed border-gray-600" key={index}>
                                <div className="bg-white p-4 md:py-10 md:px-8 rounded-xl shadow-lg">
                                    <header className="mt-2 text-center">
                                        <div className="mb-2">
                                            <h2>
                                                <Link href={proj.link} className="text-teal-600">{proj.title}</Link>
                                            </h2>
                                        </div>
                                    </header>
                                    <div className="text-center">
                                        <p>{proj.description}</p>
                                    </div>
                                </div>
                            </div>
                        })
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

export default Projects;