'use client'
import { useEffect, useState } from "react";
import { AccessTime } from "@mui/icons-material";
import { MONTHS, WEEK_DAYS } from "@/constants/constants";

/** Zero-pad a number to two digits. */
const pad = (n: number) => String(n).padStart(2, '0');

function DigitalClock() {
    const [time, setTime] = useState<Date>();

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!time) return <></>;

    const day   = WEEK_DAYS[time.getDay()];
    const month = MONTHS[time.getMonth()];
    const rawH  = time.getHours();
    const h12   = rawH % 12 === 0 ? 12 : rawH % 12;
    const mins  = time.getMinutes();
    const secs  = time.getSeconds();
    const ampm  = rawH >= 12 ? 'pm' : 'am';

    // Colon visibility synced to the second tick: visible on even seconds, dim on odd.
    // This avoids CSS animation drift — opacity is driven by React state, not a separate timer.
    const colonOpacity = secs % 2 === 0 ? 1 : 0.2;

    // -- Old one-liner (kept for reference) --
    // const timeJSX_ = <>{(hours % 12 === 0 ? 12 : hours % 12).toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}:{('0' + time.getSeconds()).slice(-2)} {hours >= 12 ? 'pm' : 'am'}</>

    return (
        <div className="inline-flex items-baseline gap-1.5">
            <AccessTime
                className="self-center opacity-70"
                fontSize="inherit"
                style={{ verticalAlign: 'middle' }}
            />

            {/* Date part */}
            <span>
                {day}, {pad(time.getDate())} {month} {time.getFullYear()}
            </span>

            <span className="opacity-40 select-none">·</span>

            {/* Time part — tabular-nums keeps digits width-stable as they change */}
            <span className="inline-flex items-baseline tabular-nums font-mono tracking-wide">
                <span>{pad(h12)}</span>
                <span style={{ opacity: colonOpacity, padding: '0 1px' }}>:</span>
                <span>{pad(mins)}</span>
                <span style={{ opacity: colonOpacity, padding: '0 1px' }}>:</span>
                <span>{pad(secs)}</span>
                <span className="ml-1 uppercase">{ampm}</span>
            </span>
        </div>
    );
}

export default DigitalClock;