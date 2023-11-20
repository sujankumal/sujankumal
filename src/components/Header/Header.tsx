import Image from "next/image";
import headerImage from '/public/images/header.jpg';
import Ticker from "./Ticker";
import { Facebook, Twitter, Instagram, GitHub, LinkedIn, Link as SocialLink } from '@mui/icons-material';


import Link from "next/link";
import DigitalClock from "../DateTime/DigitalClock";
import Navbar from "./Navbar";
import { SiteType } from "@/types/site";
import { fetchPostTitle, fetchSite, fetchSocial } from "@/services/data_access";
import { PostType } from "@/types/post";
import { SocialType } from "@/types/social";
import { APP_BASE_URL } from "@/constants/config";
import { SvgIcon } from "@mui/material";

const social: Array<SocialType> = await fetchSocial().then((data) => {
    console.log("Social Data:", data);
    return data;
});

const posts: Array<PostType> = await fetchPostTitle().then((data) => {

    console.log(data, data[0]?.title);
    return data;
});

const sites: Array<SiteType> = await fetchSite().then((data) => {
    return data;
});

function Header() {

    return (<>
        <header className="mb-3">
            <div className="">
                <Image
                    src={headerImage}
                    alt="Er. Sujan Kumal"
                    priority={true}
                />
            </div>
            <div className="bg-gray-800 px-2">
                <div className="md:flex text-white ">
                    <div className="bg-teal-600 h-8 w-full flex flex-col justify-center  md:w-1/6 md:ml-20 float-left px-3 text-center font-semibold">Latest</div>
                    <div className="w-full h-8 text-sm inline-block">
                        {/* <List items={items}/> */}
                        <Ticker items={posts} />
                    </div>
                </div>
            </div>
            <div className="border-t-2 border-t-teal-600 bg-gray-800 px-2">
                <div className="p-2">
                    <div className="text-sm text-white text-center md:inline-block mb-1">
                        <div className="inline-flex float-none text-xs">
                            <DigitalClock />
                        </div>
                        <div className="inline-block float-none"></div>
                    </div>
                    <div className="block float-none text-center  md:inline-block md:float-right text-xs">
                        {
                            social.map((soc, index) => {
                                // return <div key={index}></div>
                                switch (soc.name) {
                                    case "facebook":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.facebook.com/" + soc.username} target="_blank">
                                                <Facebook htmlColor="#1877f2" />
                                            </Link>
                                        </span>
                                    case "instagram":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.instagram.com/" + soc.username} target="_blank">
                                                <Instagram htmlColor="#ff7800" />
                                            </Link>
                                        </span>
                                    case "twitter":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.twitter.com/" + soc.username} target="_blank">
                                                <Twitter htmlColor="#1eaaff" />
                                            </Link>
                                        </span>
                                    case "threads":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.threads.net/" + soc.username} target="_blank">
                                                <SvgIcon htmlColor="#c9510c">
                                                    <svg xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision"
                                                        textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd"
                                                        clipRule="evenodd" viewBox="0 0 512 512">
                                                        <path d="M105 0h302c57.75 0 105 47.25 105 105v302c0 57.75-47.25 105-105 105H105C47.25 512 0 464.75 0 407V105C0 47.25 47.25 0 105 0z" />
                                                        <path fill="#fff" fillRule="nonzero" d="M337.36 243.58c-1.46-.7-2.95-1.38-4.46-2.02-2.62-48.36-29.04-76.05-73.41-76.33-25.6-.17-48.52 10.27-62.8 31.94l24.4 16.74c10.15-15.4 26.08-18.68 37.81-18.68h.4c14.61.09 25.64 4.34 32.77 12.62 5.19 6.04 8.67 14.37 10.39 24.89-12.96-2.2-26.96-2.88-41.94-2.02-42.18 2.43-69.3 27.03-67.48 61.21.92 17.35 9.56 32.26 24.32 42.01 12.48 8.24 28.56 12.27 45.26 11.35 22.07-1.2 39.37-9.62 51.45-25.01 9.17-11.69 14.97-26.84 17.53-45.92 10.51 6.34 18.3 14.69 22.61 24.73 7.31 17.06 7.74 45.1-15.14 67.96-20.04 20.03-44.14 28.69-80.55 28.96-40.4-.3-70.95-13.26-90.81-38.51-18.6-23.64-28.21-57.79-28.57-101.5.36-43.71 9.97-77.86 28.57-101.5 19.86-25.25 50.41-38.21 90.81-38.51 40.68.3 71.76 13.32 92.39 38.69 10.11 12.44 17.73 28.09 22.76 46.33l28.59-7.63c-6.09-22.45-15.67-41.8-28.72-57.85-26.44-32.53-65.1-49.19-114.92-49.54h-.2c-49.72.35-87.96 17.08-113.64 49.73-22.86 29.05-34.65 69.48-35.04 120.16v.24c.39 50.68 12.18 91.11 35.04 120.16 25.68 32.65 63.92 49.39 113.64 49.73h.2c44.2-.31 75.36-11.88 101.03-37.53 33.58-33.55 32.57-75.6 21.5-101.42-7.94-18.51-23.08-33.55-43.79-43.48zm-76.32 71.76c-18.48 1.04-37.69-7.26-38.64-25.03-.7-13.18 9.38-27.89 39.78-29.64 3.48-.2 6.9-.3 10.25-.3 11.04 0 21.37 1.07 30.76 3.13-3.5 43.74-24.04 50.84-42.15 51.84z" />
                                                    </svg>
                                                </SvgIcon>
                                            </Link>
                                        </span>
                                    case "linkedin":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.linkedin.com/in/" + soc.username} target="_blank">
                                                <LinkedIn htmlColor="#0077b5" />
                                            </Link>
                                        </span>
                                    case "github":
                                        return <span className="mx-2" key={index}>
                                            <Link href={"https://www.github.com/" + soc.username} target="_blank">
                                                <GitHub htmlColor="#c9510c" />
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

            <div className="p-5 block">
                <div className="w-full">
                    <div className="text-center md:text-left">
                        <div className="mt-5">
                            <h1 className="uppercase font-bold text-2xl">
                                <Link className="text-teal-600" href={APP_BASE_URL || '/'} rel="home">{sites.slice(-1)[0].name}</Link>
                            </h1>
                            <p className="text-light">{sites.slice(-1)[0].motto}</p>
                        </div>
                    </div>
                    <div className="header-ads-wrapper google-adsence">
                    </div>
                </div>
            </div>
            <Navbar />
        </header>

    </>);
}

export default Header;