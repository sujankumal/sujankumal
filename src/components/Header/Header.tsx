import Image from "next/image";
import headerImage from '/public/images/header.jpg';
import Ticker from "./Ticker";
import {Facebook, Twitter, Instagram, GitHub} from '@mui/icons-material';


import Link from "next/link";
import DigitalClock from "../DigitalClock";
import Navbar from "./Navbar";
import { SiteType } from "@/types/site";
import { fetchPostTitle, fetchSite } from "@/services/data_access";
import { PostType } from "@/types/post";

const items = ['श्री शिव महिम्नः स्तोत्रं।', '3 Eggs and 3 Lessons', 'Achyutam Keshavam', 'मीठे रस से भरी रे राधा रानी लागे', 'Hello world!'];

const posts:Array<PostType> = await fetchPostTitle().then((data)=>{
    
    console.log(data, data[0].title);
    return data;
});

const sites:Array<SiteType> = await fetchSite().then((data)=>{
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
                        <span className="mx-2">
                            <Link href={"https://www.facebook.com/Er.SujanKumal.03"} target="_blank">
                                <Facebook htmlColor="#1877f2"/>
                            </Link>
                        </span>
                        <span className="mx-2">
                            <Link href={"https://twitter.com/sujan_03_"} target="_blank">
                                <Twitter htmlColor="#1eaaff"/>
                            </Link>
                        </span>
                        <span className="mx-2">
                            <Link href={"https://www.instagram.com/sujan_03_/"} target="_blank">
                                <Instagram htmlColor="#ff7800"/>
                            </Link>
                        </span>
                        <span className="mx-2">
                            <Link href={"https://github.com/sujankumal/"} target="_blank">
                                <GitHub htmlColor="c9510c"/>
                            </Link>
                        </span>
                    </div>
                </div> 
            </div>

            <div className="p-5 block">
                <div className="w-full">
                    <div className="text-center md:text-left">
                        <div className="mt-5">
                            <h1 className="uppercase font-bold text-2xl">
                                <Link className="text-teal-600" href={""} rel="home">Er. Sujan Kumal</Link>
                            </h1>
                            <p className="text-light">Do your duty, but do not concern yourself with the results. </p>
                        </div>
                    </div>
                    <div className="header-ads-wrapper google-adsence">
                    </div>
                </div>
            </div>
            <Navbar/>
        </header>

    </>);
}

export default Header;