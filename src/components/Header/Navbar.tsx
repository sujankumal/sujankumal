"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Search, Menu, MenuOpen, Cottage } from "@mui/icons-material";
import Link from "next/link";
import Searchbar from "../Searchbar";
import SearchDialog from "../SearchDialog";

const menu = [
  { name: "About", url: "/about" },
  { name: "Articles", url: "/articles"},
  { name: "Technologies", url: "/technologies"},
  { name: "Updates", url: "/updates"},
  { name: "Projects", url: "/projects"},
];
let elementDistanceFromTop = 0;
    
const Navbar = () => {
  const [navbar, setNavbar] = useState(false);
  const [search, setSearch] = useState(false);

  const [isNavFixed, setisNavFixed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(()=>{
    const handleScroll = () => {
      // Calculate scrolled distance to set Navbar to fixed.
      
      const element = elementRef.current;
      let scrolledDistanceY = window.scrollY;
      if (element){
        if(elementDistanceFromTop == 0){
          elementDistanceFromTop = element.offsetTop;
        }
        if (scrolledDistanceY >= elementDistanceFromTop){
          setisNavFixed(true);
        }else{
          setisNavFixed(false);
        }
      }
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, {
      passive:true
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    }
  }, [elementRef]);
  
  let fixedNavClass = (isNavFixed)?" fixed top-0 z-10":"";
  
  return (<>
  <Suspense fallback={<div className="h-12"></div>}>
    <div className={isNavFixed?"block h-12 border-t-2":"hidden"}></div>
    <nav className={"w-full bg-gray-800 border-t-4 border-teal-600 shadow"+fixedNavClass } ref={elementRef}>
      <div className="flex justify-between px-4 mx-auto lg:max-w-7xl md:items-center md:flex md:px-8">
        <div className="flex items-center justify-between md:block">
          <div className="avatar bg-teal-600 p-3">
            <Link href="/" className="h-full">
              <div className="w-auto rounded ">
                <Cottage className="text-white" />
              </div>
            </Link>
          </div>
          <div className="md:hidden">
            <button
              className="p-2 text-teal-600 rounded-md outline-none"
              onClick={() => setNavbar(!navbar)}
            >
              {navbar ? (
                <MenuOpen />
              ) : (
                <Menu />
              )}
            </button>
          </div>
        </div>
        <div className={`flex-1 pb-3 mt-12 absolute left-0 overflow-y-auto max-h-screen 
                  w-screen bg-gray-800 md:relative md:block md:mx-6 md:pb-0 md:mt-0 
                  ${navbar ? "block" : "hidden"}`}
                  onClick={() => setNavbar(!navbar)}
        >
          <ul className="items-center space-y-8 pl-6 pt-6 md:flex md:pl-0 md:pt-0 md:space-x-6 md:space-y-0">
            {menu.map(({ name, url }, index) => (
              <li key={index} className="text-white text-sm uppercase hover:text-teal-600 duration-300">
                <Link href={url}>{name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="float-left bg-teal-600 p-3 text-white">
          <button onClick={()=>{
            setSearch(!search);
          }}>
          <Search/>
          </button>
        </div>
      </div>
      <div className={(search)?"border-t-2 w-max absolute right-3 border-teal-600 m-2 rounded-md":"hidden"}>
        <Searchbar 
          // onSubmit={(searchTerm:string)=>{
          // console.log("Searched For:", searchTerm); 
          // }} inputProps={{}} 
        />
        <SearchDialog />
      </div>
      
    </nav>
    </Suspense>
    </>
  );
};
export default Navbar;