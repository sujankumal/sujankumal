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

    return <div ref={fabRef} className="fixed bottom-5 left-5 z-50 isolate">
        <div className={showMenu?"block ml-1 text-orange-600 font-extrabold text-sm drop-shadow-[-2px_2px_0px_rgb(10,10,10)]":"hidden"}>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-4 flex flex-col gap-2 max-h-48 overflow-auto scrollbar scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full">
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/2048/" title="2048" onClick={() => setshowMenu(false)}>
                        <ShuffleOn className="text-orange-700" fontSize="large"/>
                        <span className="ml-4">2048</span>
                    </Link>
                </div>
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/short-urls" title="Generate short links for long links. " onClick={() => setshowMenu(false)}>
                        <svg 
                            className="inline-flex w-8 h-8 text-gray-700"                        
                            xmlns="http://www.w3.org/2000/svg" 
                            x="0px" 
                            y="0px" 
                            viewBox="0 0 24 24" 
                            width="24" 
                            height="24">
                                <g><g><g><path d="M13.358 11.891c-0.08 -0.018 -0.138 -0.095 -0.138 -0.182v-2.761h0.814c0.982 0 1.804 -0.7 1.993 -1.627h-2.806a0.406 0.406 0 0 1 -0.407 -0.407 0.407 0.407 0 0 1 0.407 -0.407h2.847v-1.22a0.407 0.407 0 0 0 -0.407 -0.407H8.339a0.407 0.407 0 0 0 -0.407 0.407v1.627c0 1.121 0.912 2.034 2.034 2.034h0.814v4.068c0 0.673 0.548 1.22 1.22 1.22 0.996 0 1.928 0.394 2.625 1.111 0.696 0.716 1.064 1.66 1.035 2.657 -0.054 1.906 -1.649 3.501 -3.554 3.554 -1.816 0.058 -3.418 -1.263 -3.717 -3.058 -0.097 -0.585 -0.585 -1.01 -1.161 -1.01h-0.082c-0.351 0 -0.682 0.151 -0.907 0.415a1.169 1.169 0 0 0 -0.267 0.943c0.475 3.02 3.038 5.151 6.021 5.151 0.276 0 0.556 -0.018 0.838 -0.056 2.725 -0.363 4.817 -2.434 5.206 -5.153 0.452 -3.16 -1.604 -6.191 -4.68 -6.9"/><path d="M19.322 0H4.678a0.406 0.406 0 0 0 -0.407 0.407v1.22h2.847c0.225 0 0.407 0.182 0.407 0.407s-0.182 0.407 -0.407 0.407H4.312c0.189 0.927 1.011 1.627 1.993 1.627h11.39c1.121 0 2.034 -0.912 2.034 -2.034V0.407A0.406 0.406 0 0 0 19.322 0"/></g></g></g></svg>
                        <span className="ml-4 pb-4">Short URL</span>
                    </Link>
                </div>
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/qr" title="Generate QR" onClick={() => setshowMenu(false)}>
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="inline-flex w-8 h-8 text-gray-700"><path d="M3 9h6V3H3zm1-5h4v4H4zm1 1h2v2H5zm10 4h6V3h-6zm1-5h4v4h-4zm1 1h2v2h-2zM3 21h6v-6H3zm1-5h4v4H4zm1 1h2v2H5zm15 2h1v2h-2v-3h1zm0-3h1v1h-1zm0-1v1h-1v-1zm-10 2h1v4h-1v-4zm-4-7v2H4v-1H3v-1h3zm4-3h1v1h-1zm3-3v2h-1V3h2v1zm-3 0h1v1h-1zm10 8h1v2h-2v-1h1zm-1-2v1h-2v2h-2v-1h1v-2h3zm-7 4h-1v-1h-1v-1h2v2zm6 2h1v1h-1zm2-5v1h-1v-1zm-9 3v1h-1v-1zm6 5h1v2h-2v-2zm-3 0h1v1h-1v1h-2v-1h1v-1zm0-1v-1h2v1zm0-5h1v3h-1v1h-1v1h-1v-2h-1v-1h3v-1h-1v-1zm-9 0v1H4v-1zm12 4h-1v-1h1zm1-2h-2v-1h2zM8 10h1v1H8v1h1v2H8v-1H7v1H6v-2h1v-2zm3 0V8h3v3h-2v-1h1V9h-1v1zm0-4h1v1h-1zm-1 4h1v1h-1zm3-3V6h1v1z"/><path fill="none" d="M0 0h24v24H0z"/></svg>
                        <span className="ml-4 pb-4">Generate QR</span>
                    </Link>
                </div>
                 <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/qr-scan" title="Scan QR" onClick={() => setshowMenu(false)}>
                        <svg 
                            fill="#000000" 
                            width="24px" 
                            height="24px" 
                            viewBox="0 0 0.72 0.72" 
                            id="scan" 
                            data-name="Flat Color" 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="inline-flex w-8 h-8 text-gray-700">
                                <path id="secondary" d="M0.63 0.39H0.09a0.03 0.03 0 0 1 0 -0.06h0.54a0.03 0.03 0 0 1 0 0.06" className="fill-[#2ca9bc] "/>
                                <path id="primary" d="M0.09 0.24a0.03 0.03 0 0 1 -0.03 -0.03V0.12a0.06 0.06 0 0 1 0.06 -0.06h0.09a0.03 0.03 0 0 1 0 0.06H0.12v0.09a0.03 0.03 0 0 1 -0.03 0.03m0.57 -0.03V0.12a0.06 0.06 0 0 0 -0.06 -0.06h-0.09a0.03 0.03 0 0 0 0 0.06h0.09v0.09a0.03 0.03 0 0 0 0.06 0M0.24 0.63a0.03 0.03 0 0 0 -0.03 -0.03H0.12v-0.09a0.03 0.03 0 0 0 -0.06 0v0.09a0.06 0.06 0 0 0 0.06 0.06h0.09a0.03 0.03 0 0 0 0.03 -0.03m0.42 -0.03v-0.09a0.03 0.03 0 0 0 -0.06 0v0.09h-0.09a0.03 0.03 0 0 0 0 0.06h0.09a0.06 0.06 0 0 0 0.06 -0.06"/>
                            </svg>
                        <span className="ml-4 pb-4">Scan QR</span>
                    </Link>
                </div>
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/imagetools" title="Image Tool" onClick={() => setshowMenu(false)}>
                        <svg fill="none" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" className="inline-flex w-8 h-8 text-gray-700" >
                            <g id="color">
                                <path fill="#e27022" d="m47.25 44.38 2.658 2.696 5.591 1.245-1.291 4.058 0.75 3.218 2.208-0.7136 2.625-4.979 1.699-5.4c-3.714-2.637-4.903-6.142-6.384-9.809z"/>
                                <path fill="#E27022" d="m30.95 43.79-1.819 2.842-1.583 7.534-1.602 1.754-2.94-1.088-0.3333-5.25s0.5-4.511 1-6.547c0.5-2.036 5.333-2.366 5.333-2.366l1.944 3.121z"/>
                                <path fill="#F4AA41" d="m50.8 29.28c-0.0178-0.0229-0.0324-0.0417-0.0436-0.0563 0.0125 0.0162 0.0251 0.0325 0.0436 0.0563z"/>
                                <path fill="#F4AA41" d="m51.75 30.51c-0.1079-0.1391-0.1959-0.2526-0.2845-0.3668 0.1603 0.2067 0.2845 0.3668 0.2845 0.3668z"/>
                                <path fill="#F4AA41" d="m51.47 30.14c-0.2275-0.2932-0.5278-0.6804-0.6703-0.8642 0.0998 0.1286 0.3097 0.3994 0.6703 0.8642z"/>
                                <path fill="#f4aa41" d="m67.14 16.53-2.516-0.3133-4.29 1.557c-0.4949 3.096-1.209 8.033-1.209 8.033l-4.066 3.823-6.591 0.9037-5.66-2.434-15.53-1.146-6.442 1.238-6.324-2.754-4.26-2.829-3.623 0.739 1.75 3.417-3.318 5.1 0.9412 4.237s4.63 0.0092 6.91 0.5499l3.396-1.197c-0.5476 2.351 0.6858 4.811 1.548 6.939-2.867 1.41-4.38 2.611-5.217 4.64-0.3842 0.9322-0.6255 3.266-0.7894 4.648l2.798 2.062s3.938-0.3125 2.344-4.577l2.799-2.733c1.502-0.7944 4.45-2.175 4.45-2.175l14.5 0.7273 2.743 3.189-1.329 7.442 2.556-0.2704 4.885-6.5v-3.489s4.941-5.533 6.021-8.887l0.0119 0.0164s5.806-3.004 8.03-7.525c3.597-5.054-0.6774-9.975 4.438-8.312 1.289 0.4189 2.883-2.184 1.32-3.809-0.2826-0.3119-0.1871-0.2065-0.2826-0.3119z"/>
                            </g>
                            <g id="hair"/>
                            <g id="skin"/>
                            <g id="skin-shadow"/>
                            <g id="line">
                                <path fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" d="m12.46 35.74c-2.333 1-4.917 0.8333-4.917 0.8333-1.677 0.1458-3.115-4.01-2.485-4.733l3.318-5.1-1.75-3.417s5.008-1.415 7.883 2.09c0.3444 0.42 0.7943 0.7429 1.279 0.9871 0.0298 0.015 0.0602 0.0302 0.0912 0.0456 2.593 1.289 5.546 1.571 8.385 0.9981 7.222-1.458 14.07-1.37 21.7 2.212 7.625 3.583 14.53-2.25 13.64-7.5-0.793-4.647 3.562-7.583 6.75-5"/>
                                <path fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" d="m16.05 48.82c0.6006-2.206 8.491-3.648 8.491-3.648s3.228-1.201 1.426-4.504"/>
                                <path fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" d="m18.3 33.24c-1.543 1.834-3.893 4.803-0.44 9.158 0 0-6.756 2.853-6.006 8.033 0 0 0.3624 2.476 2.402 2.402"/>
                                <path fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" d="m23.5 50.03c-1.156 7.254 2.386 6.055 3.017 5.661 1.148-0.7173 1.848-9.854 3.952-11.31 1.592-1.104 8.167-0.3021 8.167-0.3021"/>
                                <path fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" d="m38.44 41.33c0.0911 1.742 0.7529 3.402 1.734 4.845 0.6616 0.9727 1.803 2.32 1.453 2.985-4.479 8.5 0.6224 7.022 1.083 6.167 3.188-5.917 6.125-4.104 4.647-10.52 0 0 5.27-1.81 5.52-7.977"/>
                                <path fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="2" d="m48.15 45.59s2.367 3.204 7.758 2.693c0 0-3.326 6.762 0 7.62 1.917 0.4941 4.722-11.16 4.722-11.16s-1.839-0.7937-3.951-4.182"/>
                            </g>
                        </svg>
                        <span className="ml-4 pb-4">Image Tool</span>
                    </Link>
                </div>
                <div className="my-2 hover:scale-110 duration-300">
                    <Link href="/p2p-share" title="Share Files" onClick={() => setshowMenu(false)}>
                        <svg className="inline-flex w-8 h-8 text-gray-700" viewBox="-2.4 -2.4 28.80 28.80" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#d6c405" stroke="#d6c405">
                            <g id="SVGRepo_bgCarrier" strokeWidth="0">
                                <rect x="-2.4" y="-2.4" width="28.80" height="28.80" rx="14.4" fill="#ffffff" strokeWidth="0"></rect>
                            </g>
                            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                            <g id="SVGRepo_iconCarrier"> 
                                <title>ic_fluent_share_24_regular</title>
                                <desc>Created with Sketch.</desc> 
                                <g id="🔍-Product-Icons" strokeWidth="0.552" fill="none" fillRule="evenodd"> 
                                    <g id="ic_fluent_share_24_regular" fill="#f2de02" fillRule="nonzero"> 
                                        <path d="M6.746704,4 L10.2109085,4 C10.625122,4 10.9609085,4.33578644 10.9609085,4.75 C10.9609085,5.12969577 10.6787546,5.44349096 10.312679,5.49315338 L10.2109085,5.5 L6.746704,5.5 C5.55584001,5.5 4.58105908,6.42516159 4.50189481,7.59595119 L4.496704,7.75 L4.496704,17.25 C4.496704,18.440864 5.42186559,19.4156449 6.59265519,19.4948092 L6.746704,19.5 L16.247437,19.5 C17.438301,19.5 18.4130819,18.5748384 18.4922462,17.4040488 L18.497437,17.25 L18.497437,16.752219 C18.497437,16.3380054 18.8332234,16.002219 19.247437,16.002219 C19.6271328,16.002219 19.940928,16.2843728 19.9905904,16.6504484 L19.997437,16.752219 L19.997437,17.25 C19.997437,19.2542592 18.4250759,20.8912737 16.4465956,20.994802 L16.247437,21 L6.746704,21 C4.74244483,21 3.10543026,19.4276389 3.00190201,17.4491586 L2.996704,17.25 L2.996704,7.75 C2.996704,5.74574083 4.56906505,4.10872626 6.54754543,4.00519801 L6.746704,4 L10.2109085,4 L6.746704,4 Z M14.5006976,6.51985416 L14.5006976,3.75 C14.5006976,3.12602964 15.20748,2.7899466 15.6876724,3.13980165 L15.7698701,3.20874226 L21.7644714,8.95874226 C22.0442311,9.22708681 22.0696965,9.65811353 21.8408438,9.95607385 L21.7645584,10.0411742 L15.7699571,15.7930263 C15.3196822,16.2250675 14.5877784,15.9476738 14.5078455,15.3589039 L14.5006976,15.2518521 L14.5006976,12.5265324 L14.1572053,12.5566444 C11.7575155,12.8069657 9.45747516,13.8878535 7.24265269,15.8173548 C6.72354372,16.2695904 5.9204142,15.8420034 6.00578894,15.1588473 C6.67057872,9.83929778 9.45245108,6.90729635 14.2013326,6.53950096 L14.5006976,6.51985416 L14.5006976,3.75 L14.5006976,6.51985416 Z M16.0006976,5.50864341 L16.0006976,7.25 C16.0006976,7.66421356 15.6649111,8 15.2506976,8 C11.3772927,8 8.97667396,9.67612932 7.93942891,13.1571821 L7.86037164,13.4357543 L8.21256044,13.1989337 C10.4490427,11.7371925 12.7984587,11 15.2506976,11 C15.6303934,11 15.9441885,11.2821539 15.993851,11.6482294 L16.0006976,11.75 L16.0006976,13.4928166 L20.1619348,9.50008715 L16.0006976,5.50864341 Z" id="🎨-Color"> 
                                        </path> 
                                    </g> 
                                </g> 
                            </g>
                        </svg>
                        <span className="ml-4 pb-4">Share Files</span>
                    </Link>
                </div>
            </div>
        </div>
        <div className="mt-5 hover:animate-bounce duration-300">
            <button className=" p-1 rounded-full" onClick={() => setshowMenu(!showMenu)}>
               {/* <AppsIcon className="text-white" fontSize="large"/> */}
                <svg className='w-16 h-16' viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13ZM12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13ZM16 13C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11C15.4477 11 15 11.4477 15 12C15 12.5523 15.4477 13 16 13Z" fill="#ea580c"/>
                </svg>
            </button>
        </div>	
    </div>;
}

export default FAB;