'use client'
import { useEffect, useRef, useState } from "react";

function MousePhobia({ comp }: { comp: React.ReactNode }) {

    const [parentWidth, setparentWidth] = useState(0);
    const [parentHeight, setparentHeight] = useState(0);
    const [childPositionX, setchildPositionX] = useState(0);
    const [childPositionY, setchildPositionY] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [opacity, setOpacity] = useState(1);

    const parentRef = useRef<HTMLDivElement>(null); // Parent View DIV
    const childRef = useRef<HTMLDivElement>(null); // Child div that moves in parent view div

    useEffect(() => {
        let parent = parentRef.current;
        let child = childRef.current;
        

        const handleMouseMove = (event: MouseEvent) => {
            if (parent) {
                let parent_rect = parent.getBoundingClientRect();
                // for parent area
                setparentWidth(parent_rect.width);
                setparentHeight(parent_rect.height);
                if (child) {
                    let child_rect = child.getBoundingClientRect();
                    // position of mouse in parent to detect position inside or outside
                    let mouseX_in_div = (event.clientX < parent_rect.right)?event.clientX - parent_rect.x:-1;
                    let mouseY_in_div = (event.clientY < parent_rect.bottom)?event.clientY - parent_rect.y:-1;

                    // function shift_left() {
                    //     let chng = child_rect.x-1;
                    //     if(chng < parent_rect.x){
                    //         setchildPositionX(parent_rect.right-child_rect.width);
                    //     }else{
                    //         setchildPositionX(chng);
                    //     }
                    // }
                    // function shift_right() {
                    //     let chng = child_rect.x+1;
                    //     if(chng > parent_rect.right-child_rect.width){
                    //         setchildPositionX(parent_rect.x);
                    //     }else{
                    //         setchildPositionX(chng);
                    //     }
                    // }
                    // function shift_top() {
                    //     let chng = child_rect.y-1;
                    //     if(chng < parent_rect.top){
                    //         setchildPositionY(parent_rect.bottom-child_rect.height);
                    //     }else{
                    //         setchildPositionY(chng);
                    //     } 
                    // }
                    // function shift_bottom() {
                    //     let chng = child_rect.y+1;
                    //     if(chng > parent_rect.bottom-child_rect.height){
                    //         setchildPositionY(parent_rect.top);
                    //     }else{
                    //         setchildPositionY(chng);
                    //     } 
                    // }
                    
                    if ((mouseX_in_div > 0) && (mouseY_in_div > 0) && (mouseX_in_div < parentWidth) && (mouseY_in_div < parentHeight)) {
                        // mouse is inside parent view
                        
                        const newX = Math.floor(Math.random()*parentWidth);  
                        const newY = Math.floor(Math.random()*parentHeight);
                    
                        setchildPositionX((newX>parent_rect.right-child_rect.width)?0:newX);
                        setchildPositionY((newY>parent_rect.bottom-child_rect.height)?0:newY);
                        
                        // let is_mouse_top = event.clientY <= child_rect.y;
                        // let is_mouse_bottom = event.clientY >= child_rect.bottom;
                        // let is_mouse_right = event.clientX >= child_rect.right;
                        // let is_mouse_left = event.clientX <= child_rect.x;

                        // if(is_mouse_top && is_mouse_right){
                        //     // mouse top right
                        //     shift_bottom();   
                        //     shift_left();
                        // }else if (is_mouse_top && is_mouse_left){
                        //     // mouse top left
                        //     shift_bottom();   
                        //     shift_right();
                        // }else if(is_mouse_bottom && is_mouse_right){
                        //     // bottom right
                        //     shift_top();
                        //     shift_left();
                        // }else if(is_mouse_bottom && is_mouse_left){
                        //     // bottom left
                        //     shift_top();
                        //     shift_right();
                        // }else if (is_mouse_right) {
                        //     // pointer on right side of child
                        //     shift_left();
                        // } else if(is_mouse_left) {
                        //     // pointer on left side of child
                        //     shift_right();
                        // }else if (is_mouse_bottom) {
                        //     // pointer on bottom side of child
                        //     shift_top();
                        // } else if(is_mouse_top) {
                        //     // pointer on top side of child
                        //     shift_bottom();   
                        // }else{
                        //     setchildPositionX(10);
                        //     setchildPositionY(10);
                        // }

                    } else {
                        console.log("Is Outside");
                    }
                }
            }
        }

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        }
    }, [parentWidth, parentHeight, parentRef]);

    useEffect(() => {
        setOpacity(0);
        const timeout = setTimeout(() => {
            setOpacity(1);
        }, 500);
        
        return () => clearTimeout(timeout);
        
    }, [isAnimating, childPositionX, childPositionY]);

    useEffect(() => {
        console.log("childPositionX, childPositionY",childPositionX, childPositionY);
    }, [childPositionX, childPositionY])

    const animationClass = isAnimating ? "animation-pulse" : "";

    return (<div
        ref={parentRef}
        className={`w-full h-80 border border-dotted border-black`}
        >
        <div ref={childRef}
            style={
            {
                position: "relative",
                // left: childPositionX,
                // top: childPositionY,
                opacity:opacity,
                transform:`translate(${childPositionX}px, ${childPositionY}px)`,
            }
            }
             
        className={`border w-max ${animationClass}`}>{comp}</div>
    </div>
    );
}

export default MousePhobia;