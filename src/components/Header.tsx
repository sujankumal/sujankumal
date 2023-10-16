import Image from "next/image";
import headerImage from '/public/images/header.jpg';
import Ticker from "./Ticker";
import {Facebook, Twitter, Instagram, GitHub, AccessTime} from '@mui/icons-material';


import Link from "next/link";
import DigitalClock from "./DigitalClock";

function Header() {
    const items = ['श्री शिव महिम्नः स्तोत्रं।', '3 Eggs and 3 Lessons', 'Achyutam Keshavam', 'मीठे रस से भरी रे राधा रानी लागे', 'Hello world!'];
    
    return (<>
        <header className="mb-3">
            <div className="">
                <Image
                    src={headerImage} 
                    alt="Er. Sujan Kumal" 
                    priority={true}
                />
            </div>
            <div className="bg-gray-900 px-2">
                <div className="md:flex text-white ">    
                    <div className="bg-teal-600 h-8 w-full flex flex-col justify-center  md:w-1/6 md:ml-20 float-left px-3 text-center font-semibold">Latest</div>
                    <div className="w-full h-8 text-sm inline-block">
                        {/* <List items={items}/> */}
                        <Ticker items={items} />
                    </div>
                </div>
            </div>
            <div className="top-header-section border-t-2 border-t-teal-600 bg-gray-900 px-2">
                <div className="p-2">
                    <div className="text-sm text-white text-center md:inline-block mb-1">
                        <div className="inline-flex float-none text-xs">
                            <AccessTime fontSize="small"/> 
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
                                <Instagram htmlColor="#ff7900"/>
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

            <div className="logo-ads-wrapper clearfix">
                <div className="mgs-container">
                    <div className="site-branding">
                        <div className="site-title-wrapper">
                            <h1 className="site-title"><a href="/" rel="home">Er. Sujan Kumal</a></h1>
                            <p className="site-description">Do your duty, but do not concern yourself with the results. </p>
                        </div>
                    </div>
                    <div className="header-ads-wrapper google-adsence">
                    </div>
                </div>
            </div>

            <div id="mgs-menu-wrap" className="bottom-header-wrapper clearfix">
                <div className="mgs-container">
                    <div className="home-icon"><a href="/" rel="home"> <i className="fa fa-home"> </i> </a></div>
                    <a href="#" className="menu-toggle"> <i className="fa fa-navicon"> </i> </a>
                    <nav id="site-navigation" className="main-navigation">
                        <div className="menu">
                            <ul>
                                <li className="page_item page-item-2"><a href="/ghost/site/about">About</a></li>
                                <li className="page_item page-item-14"><a href="/ghost/site/articles">Articles</a></li>
                                <li className="page_item page-item-3"><a href="/ghost/site/privacy-policy">Privacy Policy</a></li>
                                <li className="page_item page-item-18"><a href="/ghost/site/twitter">Twitter</a></li>
                                <li className="page_item"><a href="/ghost/site/jokes">Jokes</a></li>
                            </ul>
                        </div>
                    </nav>
                    <div className="header-search-wrapper">
                        <span className="search-main"><i className="fa fa-search"></i></span>
                        <div className="search-form-main clearfix">
                            <form role="search" method="get" className="search-form" action="">
                                <label>
                                    <span className="screen-reader-text">Search for:</span>
                                    <input type="search" className="search-field" readOnly placeholder="Search &hellip;"
                                        name="s" />
                                </label>
                                <input type="submit" className="search-submit" value="Search" />
                            </form>
                        </div>
                    </div>
                </div>
            </div>


        </header>

    </>);
}

export default Header;