import { fetchSite } from "@/services/data_access";
import { SiteType } from "@/types/site";
import Link from "next/link";

const footerMenu = [
    { name: "Our Team", url: "/team" },
    { name: "Contact Us", url: "/contact"},
    { name: "Privacy Policy", url: "/privacy-policy"},
    { name: "Log in", url: "/users/log-in"},
];

async function Footer() {
    const site: SiteType = await fetchSite();
    return (<>
        <footer id="colophon" className="bg-gray-800 pb-3 text-white p-4 text-sm mt-3 md:flex">
            <div className="float-left w-full inline-flex justify-center p-2">
                &copy; {site.year} {site.copyright} | Thank you.
            </div>
            <div className="w-full mt-12 mb-6 md:mt-0 md:mb-0 overflow-y-auto inline-flex justify-center h-auto">
                <ul className="inline-block p-2">
                    {footerMenu.map(({ name, url }, index) => (
                        <li key={index} className="inline-block text-white text-sm w-fit px-2 hover:text-teal-600">
                            <Link href={url}>{name}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </footer>
    </>);
}

export default Footer;