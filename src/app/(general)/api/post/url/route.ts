import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    
    const posts = await prisma.post.findMany(
        {
            orderBy:{
                id:'desc'
            },
            select:{
                id: true,
                url: true,
            }
        }
    ).catch((error: any) => {
        throw error;
    });
    return NextResponse.json(posts);
}


// 
// export const dynamicParams = true // true | false,
// export const revalidate = 86400;
//