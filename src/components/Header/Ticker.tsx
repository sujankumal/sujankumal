'use client'
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

function Ticker({items}:{items:Array<string>}) {
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
        <div className="inline-block w-full relative h-full overflow-hidden pt-2 pl-4 z-0">
            <ul className="flex flex-col space-x-2 relative">
            { items.map((item, index): any => {
                return  <motion.li
                            key={index}
                            className={activeIndex === index ? "inline-block" : "hidden"}
                            animate={{
                                y:activeIndex === index ? 0 : -50,
                                opacity:activeIndex === index ? 1 :0,
                            }} 
                            transition={{
                                duration:2,
                                transitionEnd:{
                                    display:"none",
                                }
                            }}
                            >
                            <Link href={"#"}>{item}</Link> 
                        </motion.li>
                })}
            </ul>
        </div>
     );
}

export default Ticker;