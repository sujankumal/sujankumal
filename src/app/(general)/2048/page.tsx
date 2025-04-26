import "tailwindcss/tailwind.css";
import Game2048 from "@/components/2048/2048";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: '2048: Egg to Chicken | Sujan Kumal | A Software Engineer',
    description: "A charming twist on the classic 2048 puzzle game, this single-player sliding game challenges players to combine tiles on a 4x4 grid, evolving them from egg to majestic chicken. Slide tiles using arrow keys to merge matching stages, progressing through delightful icons representing growth (egg, chick, chicken, and more). Strategize to reach the ultimate chicken tile while keeping the grid open in this addictive, visually engaging adventure.",
    openGraph:{
        images:['/bird-1024x576-20.gif'],
        type:'website',
        url:'https://sujankumal.com.np/',
        siteName:'Sujan Kumal | A Software Engineer',
        title: '2048: Egg to Chicken | Sujan Kumal | A Software Engineer',
        description: "A charming twist on the classic 2048 puzzle game, this single-player sliding game challenges players to combine tiles on a 4x4 grid, evolving them from egg to majestic chicken. Slide tiles using arrow keys to merge matching stages, progressing through delightful icons representing growth (egg, chick, chicken, and more). Strategize to reach the ultimate chicken tile while keeping the grid open in this addictive, visually engaging adventure.",
    },
    twitter:{
        card:'summary_large_image',
        creator:'@sujan_03_',
        site:'@sujan_03_',
        images:['/bird-1024x576-20.gif'],
        title: '2048: Egg to Chicken | Sujan Kumal | A Software Engineer',
        description: "A charming twist on the classic 2048 puzzle game, this single-player sliding game challenges players to combine tiles on a 4x4 grid, evolving them from egg to majestic chicken. Slide tiles using arrow keys to merge matching stages, progressing through delightful icons representing growth (egg, chick, chicken, and more). Strategize to reach the ultimate chicken tile while keeping the grid open in this addictive, visually engaging adventure.",
    },
    robots: {
        index: true,
        follow: true,
    },
  }

  export default function Page() {
    return <Game2048 />;
  }
