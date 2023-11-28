'use client'
import {useEffect, useState} from "react";
import { AccessTime } from "@mui/icons-material";
import { MONTHS, WEEK_DAYS } from "@/constants/constants";


function DigitalClock() {
    const [time, setTime] = useState<Date>();
    
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    if (!time) return <></>

    const day = WEEK_DAYS[time.getDay()];
    const month = MONTHS[time.getMonth()];
    const hours = time.getHours()

    // Use JSX features to concatenate strings
    // const time_ = ((hours % 12 === 0) ? 12 : hours % 12) + ":" + time.getMinutes() + ":" + ('0' + time.getSeconds()).slice(-2) + ' ' + ((hours >= 12) ? 'pm' : 'am');
    const timeJSX_ = <>{hours % 12 === 0 ? 12 : hours % 12}:{time.getMinutes()}:{('0' + time.getSeconds()).slice(-2)} {hours >= 12 ? 'pm' : 'am'}</>
    
    return  <div className="flex">
                <AccessTime className="flex-row self-center" fontSize="inherit"/>            
                <span className="ml-1 inline-flex justify-center">
                    {day}, {time.getDate().toString()} {month} {time.getFullYear().toString()} {timeJSX_}
                </span>
            </div>;
}

export default DigitalClock;