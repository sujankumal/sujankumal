import Image from "next/image";
import Ticker from "./Ticker";
import { Facebook, Instagram, GitHub, LinkedIn, Link as SocialLink } from '@mui/icons-material';
import XIcon from '@mui/icons-material/X';

import Link from "next/link";
import DigitalClock from "../DateTime/DigitalClock";
import Navbar from "./Navbar";
import { SiteType } from "@/types/site";
import { fetchPostTitleTicker, fetchSite, fetchSocial } from "@/services/data_access";
import { PostTitleType } from "@/types/post";
import { SocialType } from "@/types/social";
import { SvgIcon } from "@mui/material";

export const revalidate = 86400;

async function Header() {
    const social: Array<SocialType> = await fetchSocial();
    const posts: Array<PostTitleType> = await fetchPostTitleTicker();
    const sites: SiteType = await fetchSite();
    
    return (
        <header className="mb-3">
            <div className="relative w-full h-50">
                <Image
                    src="/images/header.jpg"
                    alt="Sujan Kumal"
                    priority={true}
                    fill
                    className="object-cover object-center"
                />
            </div>
            <div className="bg-gray-800 px-2">
                <div className="md:flex text-white">
                    <div className="bg-orange-600 h-8 w-full flex flex-col justify-center  md:w-1/6 md:ml-20 float-left px-3 text-center font-semibold">Latest</div>
                    <Ticker items={posts} />
                </div>
            </div>
            <div className="border-t-2 border-t-orange-600 bg-gray-800 px-2">
                <div className="py-2 sm:px-20 md:flex">
                    <div className="text-sm text-white mb-1 w-full text-center md:max-w-max">
                        <div className="inline-flex float-none text-xs">
                            <DigitalClock />
                        </div>
                    </div>
                    <div className="text-xs flex flex-wrap justify-center md:w-full md:justify-end">
                        {
                            social.map((soc, index) => {
                                // return <div key={index}></div>
                                switch (soc.name) {
                                    case "facebook":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.facebook.com/" + soc.username} target="_blank">
                                                <Facebook htmlColor="#ea580c" />
                                            </Link>
                                        </span>
                                    case "instagram":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.instagram.com/" + soc.username} target="_blank">
                                                <Instagram htmlColor="#ea580c" />
                                            </Link>
                                        </span>
                                    case "twitter":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.X.com/" + soc.username} target="_blank">
                                                <XIcon htmlColor="#ea580c" />
                                            </Link>
                                        </span>
                                    case "threads":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.threads.net/" + soc.username} target="_blank">
                                                <SvgIcon htmlColor="#ea580c" 
                                                    viewBox="0 0 24 24">
                                                    <path fill="#fff" fillRule="nonzero" 
                                                        d="M15.8138 11.4178c-0.0684-0.0328-0.1383-0.0647-0.2091-0.0947-0.1228-2.2669-1.3613-3.5648-3.4411-3.578-1.2-0.008-2.2744 0.4814-2.9437 1.4972l1.1437 0.7847c0.4758-0.7219 1.2225-0.8756 1.7723-0.8756h0.0188c0.68480.0042 1.2019 0.2034 1.5361 0.5916 0.2433 0.2831 0.4064 0.6736 0.487 1.1667-0.6075-0.1031-1.2637-0.135-1.9659-0.0947-1.9772 0.1139-3.2484 1.267-3.1631 2.86920.0431 0.8133 0.4481 1.5122 1.14 1.9692 0.585 0.3862 1.3387 0.5752 2.1216 0.532 1.0345-0.0562 1.8455-0.4509 2.4117-1.1723 0.4298-0.548 0.7017-1.2581 0.8217-2.1525 0.4927 0.2972 0.8578 0.6886 1.0598 1.1592 0.3427 0.7997 0.3628 2.1141-0.7097 3.1856-0.9394 0.9389-2.0691 1.3448-3.7758 1.3575-1.8937-0.0141-3.3258-0.6216-4.2567-1.8052-0.8719-1.1081-1.3223-2.7089-1.3392-4.75780.0169-2.0489 0.4673-3.6497 1.3392-4.7578 0.9309-1.1836 2.363-1.7911 4.2567-1.8052 1.90690.0141 3.3638 0.6244 4.3308 1.8136 0.4739 0.5831 0.8311 1.3167 1.0669 2.1717l1.3402-0.3577c-0.2855-1.0523-0.7345-1.9594-1.3462-2.7117-1.2394-1.5248-3.0516-2.3058-5.3869-2.3222h-0.0094c-2.33060.0164-4.1231 0.8006-5.3269 2.3311-1.0716 1.3617-1.6242 3.2569-1.6425 5.6325v0.0112c0.0183 2.3756 0.5709 4.2708 1.6425 5.6325 1.2037 1.5305 2.9962 2.3152 5.3269 2.3311h0.0094c2.0719-0.0145 3.5325-0.5569 4.7358-1.7592 1.5741-1.5727 1.5267-3.5437 1.0078-4.7541-0.3722-0.8677-1.0819-1.5727-2.0527-2.0381zm-3.5775 3.3638c-0.8662 0.0488-1.7667-0.3403-1.8113-1.1733-0.0328-0.6178 0.4397-1.3073 1.8647-1.3894 0.1631-0.0094 0.3234-0.0141 0.4805-0.0141 0.5175 0.0 1.0017 0.0502 1.4419 0.1467-0.1641 2.0503-1.1269 2.3831-1.9758 2.43z" 
                                                    />
                                                </SvgIcon>
                                            </Link>
                                        </span>
                                    case "linkedin":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.linkedin.com/in/" + soc.username} target="_blank">
                                                <LinkedIn htmlColor="#ea580c" />
                                            </Link>
                                        </span>
                                    case "github":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.github.com/" + soc.username} target="_blank">
                                                <GitHub htmlColor="#ea580c" />
                                            </Link>
                                        </span>
                                    default:
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www." + soc.name + ".com/" + soc.username} target="_blank">
                                                <SocialLink htmlColor="#aaa" />
                                            </Link>
                                        </span>
                                }

                            })
                        }

                    </div>
                </div>
            </div>

            <div className="px-5 block">
                <div className="w-full">
                    <div className="text-center md:text-left md:flex">
                        <div className="w-full flex justify-center md:w-fit mr-4">
                            <Image 
                                src="/bird-100x100-20.gif" 
                                alt="Bird with rocket. Site Logo." 
                                priority={true} 
                                width={100}
                                height={100}
                                unoptimized={true}
                                />
                        </div>
                        <div className="md:mt-5 mb-2 md:mb-auto">
                            <h1 className="uppercase font-bold text-2xl">
                                <Link className="text-orange-600" href="/" rel="home">{sites.name}</Link>
                            </h1>
                            <p className="text-light">{sites.motto}</p>
                        </div>
                    </div>
                    <div className="header-ads-wrapper google-adsence">
                    </div>
                </div>
            </div>
            <Navbar />
        </header>
    );
}

export default Header;
