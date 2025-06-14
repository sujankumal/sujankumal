import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
    
    // console.log("Hello I am server get post for home method");
    
    const posts = await prisma.post.findMany(
        {
            select:{
                year:true,
                month:true,
            }
        }
    ).catch((error: any) => {
        throw error;
    });
    return NextResponse.json(posts);
}


// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
//