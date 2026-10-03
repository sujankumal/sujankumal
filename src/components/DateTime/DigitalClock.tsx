'use client'
import { useEffect, useState } from "react";
import { AccessTime } from "@mui/icons-material";

/** Zero-pad a number to two digits. */
const pad = (n: number) => String(n).padStart(2, '0');
const TIME_SYNC_INTERVAL = 5 * 60 * 1000;

function DigitalClock() {
    const [time, setTime] = useState<Date>();
    const [timeSync, setTimeSync] = useState<{
        offsetMs: number;
        roundTripMs: number;
    } | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        const updateTime = () => setTime(new Date(Date.now() + (timeSync?.offsetMs ?? 0)));
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [timeSync]);

    useEffect(() => {
        let active = true;

        const syncTime = async () => {
            const localSentAt = Date.now();
            const requestStartedAt = performance.now();

            try {
                const response = await fetch('/api/time', {
                    cache: 'no-store',
                    signal: AbortSignal.timeout(5000),
                });
                const payload: unknown = await response.json();
                const roundTripMs = performance.now() - requestStartedAt;

                if (
                    !response.ok ||
                    typeof payload !== 'object' ||
                    payload === null ||
                    !('serverTimeMs' in payload) ||
                    !('utcTime' in payload) ||
                    !('ktmTime' in payload)
                ) return;
                const referenceTime = Number(payload.serverTimeMs);
                if (
                    !Number.isFinite(referenceTime) ||
                    typeof payload.utcTime !== 'string' ||
                    typeof payload.ktmTime !== 'string' ||
                    !active
                ) return;

                const localMidpoint = localSentAt + roundTripMs / 2;
                setTimeSync({
                    offsetMs: referenceTime - localMidpoint,
                    roundTripMs,
                });
            } catch {
                // Keep the local clock, or the last successful correction, if synchronization fails.
            }
        };

        void syncTime();
        const interval = setInterval(() => void syncTime(), TIME_SYNC_INTERVAL);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, []);

    if (!time) return <></>;

    const displayTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dateTimeParts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone: displayTimeZone,
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h12',
        }).formatToParts(time).map(({ type, value }) => [type, value])
    ) as Record<string, string>;
    const day = dateTimeParts.weekday;
    const date = dateTimeParts.day;
    const month = dateTimeParts.month;
    const year = dateTimeParts.year;
    const h12 = dateTimeParts.hour;
    const mins = dateTimeParts.minute;
    const secs = dateTimeParts.second;
    const ampm = dateTimeParts.dayPeriod?.toLowerCase();

    // Colon visibility synced to the second tick: visible on even seconds, dim on odd.
    // This avoids CSS animation drift — opacity is driven by React state, not a separate timer.
    const colonOpacity = Number(secs) % 2 === 0 ? 1 : 0.2;
    const formatDetailsTime = (timeZone: string) => new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'full',
        timeStyle: 'long',
        timeZone,
    }).format(time);

    return (
        <div className="inline-flex items-baseline gap-1.5">
            <AccessTime
                className="self-center opacity-70"
                fontSize="inherit"
                style={{ verticalAlign: 'middle' }}
            />

            {/* Date part */}
            <span>
                {day}, {date} {month} {year}
            </span>

            <span className="opacity-40 select-none">·</span>

            {/* Time part — tabular-nums keeps digits width-stable as they change */}
            <span
                className="relative inline-flex"
                onMouseEnter={() => setDetailsOpen(true)}
                onMouseLeave={() => setDetailsOpen(false)}
            >
                <button
                    type="button"
                    className="inline-flex items-baseline border-0 bg-transparent p-0 font-mono tracking-wide text-inherit focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white"
                    aria-label="Show server clock details"
                    aria-expanded={detailsOpen}
                    aria-describedby={detailsOpen ? 'digital-clock-details' : undefined}
                    onFocus={() => setDetailsOpen(true)}
                    onBlur={() => setDetailsOpen(false)}
                >
                    <span>{pad(Number(h12))}</span>
                    <span style={{ opacity: colonOpacity, padding: '0 1px' }}>:</span>
                    <span>{pad(Number(mins))}</span>
                    <span style={{ opacity: colonOpacity, padding: '0 1px' }}>:</span>
                    <span>{pad(Number(secs))}</span>
                    <span className="ml-1 uppercase">{ampm}</span>
                </button>
                {detailsOpen && (
                    <span
                        id="digital-clock-details"
                        role="tooltip"
                        className="absolute right-0 top-full z-50 mt-2 w-md max-w-[calc(100vw-2rem)] whitespace-normal rounded-sm border border-gray-600 bg-gray-900 p-2 text-left font-sans text-sm leading-relaxed text-white shadow-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
                    >
                        {timeSync ? (
                            <>
                                <span className="block">UTC: {formatDetailsTime('UTC')}</span>
                                <span className="block">KTM: {formatDetailsTime('Asia/Kathmandu')}</span>
                                <span className="mt-1 block">
                                    Offset: {timeSync.offsetMs >= 0 ? '+' : '-'}{Math.abs(timeSync.offsetMs).toFixed(1)}ms
                                </span>
                                <span className="block">
                                    RTT: {Math.round(timeSync.roundTripMs)}ms; estimated uncertainty ±{Math.ceil(timeSync.roundTripMs / 2)}ms
                                </span>
                            </>
                        ) : 'Server time unavailable; showing device time.'}
                    </span>
                )}
            </span>
        </div>
    );
}

export default DigitalClock;