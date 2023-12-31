'use client'
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PostTitleType } from "@/types/post";

function Ticker({items}:{items:Array<PostTitleType>}) {
    const [activeIndex, setActiveIndex] = useState(0);
   
    useEffect(()=>{
        const interval = setInterval(() => {
            setActiveIndex((activeIndex + 1) % items.length);
        },3000);
        return () =>{
            clearInterval(interval);
        };
    }, [items, activeIndex]);

    return ( 
        <div className="inline-block w-full h-8 text-sm overflow-hidden pt-2 pl-4 z-0">
            <div className="flex flex-col space-x-2 relative">
            { items.map((item, index): any => {
                return  <motion.div
                            key={index}
                            className="absolute top-0 hover:text-teal-600"
                            initial={{
                                opacity:0,
                                translateY:-50,
                            }}
                            animate={activeIndex === index ? {
                                opacity:1,
                                translateY:0,
                                transition:{
                                    duration:2,
                                },
                            }:{
                                opacity:0,
                                translateY:50,
                                transition:{
                                    duration:2,
                                },
                                transitionEnd:{
                                    translateY:-50,
                                }
                            }}
                            >
                            <Link href={"/articles/"+item.id}>{item.title}</Link> 
                        </motion.div>
                })}
            </div>
        </div>
     );
}

export default Ticker;