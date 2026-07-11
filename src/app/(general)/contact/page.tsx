import MousePhobia from "@/components/MousePhobia";
import Sidebar from "@/components/Sidebar";
import { fetchSite } from "@/services/data_access";

export default async function Contact() {
    const site = await fetchSite();
    const contactEmail = site?.contact_email || "support@sujankumal.com.np";
    
    return (
        <main className="grid md:grid-cols-4 min-h-screen justify-center">
            <div className="mb-8 p-2 md:m-8 md:col-span-3 inline-flex justify-center">
                <MousePhobia comp={
                        <div className="bg-gray-800 text-white h-fit p-2 rounded-lg text-sm">
                            <span>Feel free to connect with me at </span> 
                            <a className="hover:text-orange-600 underline text-gray-300" href={`mailto:${contactEmail}`}>{contactEmail}</a>
                        </div>
                }/>
            </div>
            <aside className="w-full md:col-span-1">
                <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
                    <Sidebar />
                </div>
            </aside>
        </main>
    );
}