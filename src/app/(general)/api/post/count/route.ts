import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
    
    // console.log("Hello I am server get post for home method");
    
    const posts = await prisma.post.findMany(
        {
            select:{
                id:true
            }
        }
    ).catch((exception: unknown)=>{
        console.log("Server Error:", exception);
        notFound();
    });
    return NextResponse.json(posts);
}

// 
// export const dynamicParams = true // true | false,
export const revalidate = 10;
// 