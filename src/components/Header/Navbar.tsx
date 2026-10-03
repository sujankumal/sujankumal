"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Search, Menu, MenuOpen, Cottage } from "@mui/icons-material";
import Link from "next/link";
import Searchbar from "../Searchbar";
import SearchDialog from "../SearchDialog";
import { usePathname } from "next/navigation";

const menu = [
  { name: "About", url: "/about" },
  { name: "Articles", url: "/articles" },
  { name: "Technologies", url: "/technologies" },
  { name: "Updates", url: "/updates" },
  { name: "Projects", url: "/projects" },
];
let elementDistanceFromTop = 0;

const Navbar = () => {
  const [navbar, setNavbar] = useState(false);
  const [search, setSearch] = useState(false);

  const [isNavFixed, setisNavFixed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Track path and query changes to auto-close search menu on link click
  const pathname = usePathname();

  useEffect(() => {
    // Close transient navigation UI when the route changes.
    setNavbar(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavbar(false);
        setSearch(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (!navbar) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (elementRef.current && !elementRef.current.contains(event.target as Node)) {
        setNavbar(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [navbar]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        setSearch(false);
      }
    };

    if (search) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [search]);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scrolled distance to set Navbar to fixed.

      const element = elementRef.current;
      let scrolledDistanceY = window.scrollY;
      if (element) {
        if (elementDistanceFromTop === 0) {
          elementDistanceFromTop = element.offsetTop;
        }
        if (scrolledDistanceY >= elementDistanceFromTop) {
          setisNavFixed(true);
        } else {
          setisNavFixed(false);
        }
      }
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    }
  }, [elementRef]);

  let fixedNavClass = (isNavFixed) ? " fixed top-0 z-10" : "";

  return (<>
    <Suspense fallback={<div className="h-12"></div>}>
      <div className={isNavFixed ? "block h-12 border-t-2" : "hidden"}></div>
      <nav aria-label="Primary navigation" className={"relative w-full bg-gray-800 border-t-4 border-orange-600 shadow" + fixedNavClass} ref={elementRef}>
        <div className="relative flex justify-between px-4 mx-auto lg:max-w-7xl md:items-center md:px-8">
          <div className="flex items-center justify-between md:block">
            <div className="avatar bg-orange-600 p-3">
              <Link href="/" className="h-full">
                <div className="w-auto rounded ">
                  <Cottage className="text-white" />
                </div>
              </Link>
            </div>
            <div className="md:hidden">
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-orange-600 outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                onClick={() => setNavbar(!navbar)}
                aria-label={navbar ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={navbar}
                aria-controls="primary-navigation-menu"
              >
                {navbar ? (<MenuOpen />) : (<Menu />)}
              </button>
            </div>
          </div>
          <div
            id="primary-navigation-menu"
            className={`absolute left-0 top-full z-40 max-h-[calc(100dvh-3rem)] w-full overflow-y-auto border-t border-gray-700 bg-gray-800 pb-3 shadow-lg md:static md:z-auto md:mx-6 md:block md:max-h-none md:w-auto md:flex-1 md:overflow-visible md:border-0 md:bg-transparent md:p-0 md:shadow-none ${navbar ? "block" : "hidden md:block"}`}
          >
            <ul className="flex flex-col px-4 pt-2 md:flex-row md:items-center md:space-x-6 md:px-0 md:pt-0">
              {menu.map(({ name, url }, index) => (
                <li key={index} className="border-b border-gray-700 text-base uppercase text-white hover:text-orange-600 duration-300 md:border-0">
                  <Link className="flex min-h-11 items-center py-2 md:py-0" href={url} onClick={() => setNavbar(false)}>{name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="float-left bg-orange-600 text-white">
            <button type="button" aria-label="Open search" className="flex min-h-11 min-w-11 items-center justify-center p-2" onClick={() => {
              setSearch(!search);
            }}>
              <Search />
            </button>
          </div>
        </div>
        {search && (
          <div
            ref={searchWrapperRef}
            className="absolute right-2 z-50 m-2 w-[calc(100vw-1rem)] max-w-md rounded-md border-t-2 border-orange-600 bg-gray-900 shadow-xl md:right-3 md:w-max">
            <Suspense fallback={<div className="p-4 text-white text-base">Loading Search...</div>}>
              <Searchbar />
              <SearchDialog />
            </Suspense>
          </div>
        )}

      </nav>
    </Suspense>
  </>
  );
};
export default Navbar;