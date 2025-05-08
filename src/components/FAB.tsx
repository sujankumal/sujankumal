'use client'
import { Photo, ShuffleOn, ViewInAr } from '@mui/icons-material';
import AppsIcon from '@mui/icons-material/Apps';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

function FAB() {
    const [showMenu, setshowMenu] = useState(false);
    const fabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showMenu) return;
        function handleClickOutside(event: MouseEvent) {
            if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
                setshowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    return <div ref={fabRef} className="fixed bottom-5 left-5">
        <div className={showMenu?"block ml-1 text-teal-600 font-extrabold text-lg drop-shadow-[-2px_2px_0px_rgb(10,10,10)]":"hidden"}>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg backdrop-blur-md p-4 flex flex-col gap-2">
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/2048/" title="2048" onClick={() => setshowMenu(false)}>
                        <ShuffleOn className="text-orange-700" fontSize="large"/>
                        <span className="ml-4">2048</span>
                    </Link>
                </div>
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/qr" title="Generate QR" onClick={() => setshowMenu(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="inline-flex w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h4v4H3V3zm0 14h4v4H3v-4zm14-14h4v4h-4V3zm0 14h4v4h-4v-4zM7 7h10v10H7V7z" /></svg>
                        <span className="ml-4 pb-4">Generate QR</span>
                    </Link>
                </div>
            </div>
        </div>
        <div className="mt-5 hover:animate-bounce duration-300">
            <button className="bg-teal-600 p-1 rounded-full" onClick={() => setshowMenu(!showMenu)}>
               <AppsIcon className="text-white" fontSize="large"/>
            </button>
        </div>	
    </div>;
}

export default FAB;