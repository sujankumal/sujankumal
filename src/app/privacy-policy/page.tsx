import MarkdownComponent from "@/components/MarkdownComponent";
import Sidebar from "@/components/Sidebar";
import { fetchSitePrivacyPolicy } from "@/services/data_access";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Privacy-Policy | Er. Sujan Kumal | A Software Engineer',
    description: "Explore our comprehensive privacy policy outlining how we collect, use, and protect your personal information.",
    openGraph:{
        images:['/bird-1024x576-20.gif'],
        type:'website',
        url:'https://vercel.sujankumal.com.np/',
        siteName:'Er. Sujan Kumal | A Software Engineer',
        title: 'Privacy-Policy | Er. Sujan Kumal | A Software Engineer',
        description: "Explore our comprehensive privacy policy outlining how we collect, use, and protect your personal information.",
    },
    twitter:{
        card:'summary_large_image',
        creator:'@sujan_03_',
        site:'@sujan_03_',
        images:['/bird-1024x576-20.gif'],
        title: 'Privacy-Policy | Er. Sujan Kumal | A Software Engineer',
        description: "Explore our comprehensive privacy policy outlining how we collect, use, and protect your personal information.",
    },
}

const privacyPolicy:{privacy_policy:string} = await fetchSitePrivacyPolicy();

function PrivacyPolicy() {
    
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 p-4 md:m-8 md:col-span-3 inline-flex justify-center">
                <div className="prose max-w-none prose-blockquote:border-l-teal-600 hover:prose-a:text-teal-600 dark:prose-a:text-inherit prose-headings:text-inherit prose-strong:text-inherit dark:prose-strong:text-inherit dark:prose-headings:text-inherit">
                    {privacyPolicy.privacy_policy?<MarkdownComponent content={privacyPolicy.privacy_policy} />:<div></div>}
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

export default PrivacyPolicy;