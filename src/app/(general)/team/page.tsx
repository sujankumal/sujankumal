import Sidebar from "@/components/Sidebar";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: 'Our Team | Sujan Kumal | A Software Engineer',
    description: "Meet our dedicated team, the driving force behind our success and innovation.",
    openGraph:{
        images:['/bird-1024x576-20.gif'],
        type:'website',
        url:'https://sujankumal.com.np/',
        siteName:'Sujan Kumal | A Software Engineer',
        title: 'Our Team | Sujan Kumal | A Software Engineer',
        description: "Meet our dedicated team, the driving force behind our success and innovation.",
    },
    twitter:{
        card:'summary_large_image',
        creator:'@sujan_03_',
        site:'@sujan_03_',
        images:['/bird-1024x576-20.gif'],
        title: 'Our Team | Sujan Kumal | A Software Engineer',
        description: "Meet our dedicated team, the driving force behind our success and innovation.",
    },
}

export const revalidate = 10;

async function Team() {
    let profile_image = "/bird-800x800-20.gif";
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 p-4 md:m-8 md:col-span-3">
                <div className="grid grid-cols-3 w-full gap-3 h-max">
                   {
                    <div className="col-span-1 p-3 bg-white rounded-lg shadow-lg">
                        <div className="border-b border-gray-400 mb-2">
                            <Image
                                className="w-full rounded-lg"
                                // fill={true}
                                width={300}
                                height={300}
                                src={profile_image}
                                alt={"Image for team member: SiteBot"}
                                priority={true}
                            />
                        </div>
                        <div>Name: Bot</div>
                    </div>
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

export default Team;