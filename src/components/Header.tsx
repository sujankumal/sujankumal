import Image from "next/image";
import headerImage from '/public/images/header.jpg';
import Ticker from "./Ticker";

function List(props: {items:any}){
    return(
        <ul>
            {props.items.map((item:string, index:number) =>{
                return <li 
                key={index}
                style={{animationDelay:`${index*0.5}s`}}

                >
                    {item}
                </li>
            })}
        </ul>
    )
}

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
            <div className="bg-gray-900 px-2 border-b-4 border-b-teal-600">
                <div className="md:flex text-white ">    
                    <div className="bg-teal-600 w-full p-2 inline-block md:w-1/6 float-left px-4 text-center font-semibold">Latest</div>
                    <div className="w-full">
                        {/* <List items={items}/> */}
                        <Ticker items={items} />
                    </div>
                </div>
            </div>
            <div className="top-header-section">
                <div className="mgs-container">
                    <div className="top-left-header">
                        <div className="date-section">
                            Saturday, July 04, 2020 </div>
                        <nav id="top-header-navigation" className="top-navigation">
                        </nav>
                    </div>
                    <div className="top-social-wrapper">
                        <span className="social-link">
                            <a href="https://www.facebook.com/Er.SujanKumal.03" target="_blank">
                                <i className="fa fa-facebook"></i>
                            </a>
                        </span>
                        <span className="social-link">
                            <a href="https://twitter.com/sujan_03_" target="_blank">
                                <i className="fa fa-twitter"></i>
                            </a>
                        </span>
                        <span className="social-link">
                            <a href="https://www.instagram.com/sujan_03_/" target="_blank">
                                <i className="fa fa-instagram"></i>
                            </a>
                        </span>
                        <span className="social-link">
                            <a href="https://github.com/sujankumal/" target="_blank">
                                <i className="fa fa-github"></i>
                            </a>
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