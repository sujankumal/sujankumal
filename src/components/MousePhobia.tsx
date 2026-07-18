'use client'
import { Suspense, useEffect, useRef, useState } from "react";

interface MousePhobiaProps {
    /** The element or text that will run away from the mouse pointer */
    comp: React.ReactNode;
}

// 1. Native HTML5 Canvas Galaxy Engine with Clash Effects
function GalaxyCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            alpha: number;
            phase: number;
            isClashing: boolean;
            clashTimer: number;
        }> = [];

        const colors = ["#ffffff", "#58a6ff", "#dbedff", "#ffdf7d"];

        const resizeCanvas = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            canvas.width = rect?.width || canvas.clientWidth;
            canvas.height = rect?.height || canvas.clientHeight;
            initStars();
        };

        const initStars = () => {
            stars = [];
            const starCount = Math.floor((canvas.width * canvas.height) / 2200);

            for (let i = 0; i < starCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.4 + 0.1;

                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 2 + 0.5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: Math.random() * 0.8 + 0.2,
                    phase: Math.random() * Math.PI * 2,
                    isClashing: false,
                    clashTimer: 0
                });
            }
        };

        const render = () => {
            ctx.fillStyle = "#000a12";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    const s1 = stars[i];
                    const s2 = stars[j];

                    if (!s1.isClashing && !s2.isClashing) {
                        const dx = s1.x - s2.x;
                        const dy = s1.y - s2.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 12 && Math.random() < 0.02) {
                            s1.isClashing = true;
                            s2.isClashing = true;
                            s1.clashTimer = 30;
                            s2.clashTimer = 30;
                        }
                    }
                }
            }

            stars.forEach((star) => {
                star.phase += 0.02;
                let dynamicAlpha = star.alpha + Math.sin(star.phase) * 0.15;
                let currentSize = star.size;

                if (star.isClashing) {
                    star.clashTimer--;
                    if (star.clashTimer > 15) {
                        dynamicAlpha = 1.0;
                        currentSize = star.size * 2.5;
                    } else if (star.clashTimer > 0) {
                        dynamicAlpha = (star.clashTimer / 15);
                        currentSize = star.size * 0.5;
                    } else {
                        star.isClashing = false;
                        star.x = Math.random() * canvas.width;
                        star.y = Math.random() * canvas.height;
                        star.alpha = Math.random() * 0.8 + 0.2;
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 0.4 + 0.1;
                        star.vx = Math.cos(angle) * speed;
                        star.vy = Math.sin(angle) * speed;
                    }
                }

                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, dynamicAlpha));
                ctx.fillStyle = star.isClashing && star.clashTimer > 15 ? "#ffffff" : star.color;

                ctx.beginPath();
                ctx.arc(star.x, star.y, currentSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                star.x += star.vx;
                star.y += star.vy;

                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;
            });

            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        render();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// 2. Main MousePhobia Component
function MousePhobia({ comp }: MousePhobiaProps) {
    const [position, setPosition] = useState({ x: 40, y: 40 });
    const [isScared, setIsScared] = useState(false);
    const [emojiPop, setEmojiPop] = useState<{ x: number; y: number; text: string; id: number } | null>(null);

    const parentRef = useRef<HTMLDivElement>(null);
    const childRef = useRef<HTMLDivElement>(null);

    const positionRef = useRef(position);
    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    useEffect(() => {
        const handleInteraction = (clientX: number, clientY: number) => {
            const parent = parentRef.current;
            const child = childRef.current;
            if (!parent || !child) return;

            const parentRect = parent.getBoundingClientRect();

            // Safety Check: Verify the cursor is actually inside the boundary of the component block
            if (
                clientX < parentRect.left ||
                clientX > parentRect.right ||
                clientY < parentRect.top ||
                clientY > parentRect.bottom
            ) {
                return;
            }

            const mouseXInParent = clientX - parentRect.left;
            const mouseYInParent = clientY - parentRect.top;

            const childLeft = positionRef.current.x;
            const childTop = positionRef.current.y;
            const childWidth = child.offsetWidth || 120;
            const childHeight = child.offsetHeight || 50;

            const childRight = childLeft + childWidth;
            const childBottom = childTop + childHeight;

            // Trigger window padding radius around the moving child card
            const padding = 30;

            const isTriggered =
                mouseXInParent >= childLeft - padding &&
                mouseXInParent <= childRight + padding &&
                mouseYInParent >= childTop - padding &&
                mouseYInParent <= childBottom + padding;

            if (isTriggered) {
                setIsScared(true);

                const emojis = ["😜", "😛", "🙈", "🤖", "💨", "Too slow!", "Catch me!"];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                setEmojiPop({
                    x: mouseXInParent,
                    y: mouseYInParent - 20,
                    text: randomEmoji,
                    id: Date.now()
                });

                const childCenterX = childLeft + childWidth / 2;
                const childCenterY = childTop + childHeight / 2;

                let runDirX = childCenterX - mouseXInParent;
                let runDirY = childCenterY - mouseYInParent;

                if (runDirX === 0 && runDirY === 0) {
                    runDirX = Math.random() - 0.5;
                    runDirY = Math.random() - 0.5;
                }

                const length = Math.sqrt(runDirX * runDirX + runDirY * runDirY) || 1;
                runDirX /= length;
                runDirY /= length;

                // Restrict escape locations safely to valid dimensional spaces
                const maxX = Math.max(100, parentRect.width - childWidth);
                const maxY = Math.max(100, parentRect.height - childHeight);

                const dashDistance = Math.max(parentRect.width, parentRect.height) * 0.45;
                let targetX = childLeft + runDirX * dashDistance + (Math.random() - 0.5) * 60;
                let targetY = childTop + runDirY * dashDistance + (Math.random() - 0.5) * 60;

                targetX = Math.max(20, Math.min(maxX - 20, targetX));
                targetY = Math.max(20, Math.min(maxY - 20, targetY));

                setPosition({ x: Math.floor(targetX), y: Math.floor(targetY) });

                setTimeout(() => {
                    setIsScared(false);
                }, 300);
            }
        };

        const onMouseMove = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY);
        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length > 0) handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        };
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        };

        // Window listeners bypass target bubble deadzones completely
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
        };
    }, []);

    return (
        <Suspense fallback={<div className="w-full h-full min-h-[400px] border border-dashed border-neutral-700 rounded-xl bg-neutral-900 animate-pulse" />}>
            <div
                ref={parentRef}
                className="w-full h-full min-h-[400px] relative overflow-hidden rounded-xl border border-neutral-800 bg-[#000a12] p-4 touch-none select-none"
            >
                {/* 1. Base Layer: Canvas Starfield */}
                <GalaxyCanvas />

                {/* 2. Secondary Layer: Background layout lines grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                {/* 3. Third Layer: Fleeing element box */}
                <div
                    ref={childRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${isScared ? "0.88" : "1"})`,
                        transition: isScared
                            ? "transform 280ms cubic-bezier(0.16, 1, 0.3, 1)"
                            : "transform 200ms ease-out",
                        willChange: "transform",
                        zIndex: 3
                    }}
                    className={`w-max px-2 py-1 rounded cursor-default border border-white/10 backdrop-blur-md bg-white/10 text-white transition-all duration-300 shadow-lg pointer-events-auto
                        ${isScared ? 'shadow-2xl ring-2 ring-blue-400/40 bg-white/20' : ''}`}
                >
                    {comp}
                </div>

                {/* 4. Top Layer: Playful Popup Element */}
                {emojiPop && (
                    <div
                        key={emojiPop.id}
                        style={{
                            position: "absolute",
                            left: emojiPop.x,
                            top: emojiPop.y,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                            zIndex: 4,
                        }}
                        className="animate-bounce-up text-xl sm:text-2xl font-black bg-neutral-900/90 text-white px-5 py-2 rounded-xl border-2 border-white/20 shadow-2xl backdrop-blur-sm select-none"
                    >
                        {emojiPop.text}
                    </div>
                )}
            </div>
        </Suspense>
    );
}

export default MousePhobia;
