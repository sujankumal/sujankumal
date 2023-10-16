'use client'
import { useEffect, useState } from "react";

function DigitalClock() {
    const [time, setTime] = useState(new Date());
    const days = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
    const months = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");

    useEffect(()=>{
        const interval = setInterval(()=>{
            setTime(new Date());
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    },[]);
    const day = days[time.getDay()];
    const month = months[time.getMonth()];
    const hours = time.getHours()
    const time_ = ((hours%12==0)?12:hours%12)+":"+time.getMinutes()+":"+('0'+time.getSeconds()).slice(-2)+' '+((hours >= 12) ? 'pm' : 'am');

    return ( 
        <span className="mt-1 ml-2">{day}, {time.getDate().toString()} {month} {time.getFullYear().toString()} {time_}</span>
     );
}

export default DigitalClock;