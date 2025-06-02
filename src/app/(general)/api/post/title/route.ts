import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    
    const posts = await prisma.post.findMany(
        {
            select:{
                id: true,
                title: true,
            },
            orderBy:{
                date:'desc',
            }
        }
    ).catch((exception: unknown) => {
        throw exception;
    });
    return NextResponse.json(posts);
}


// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
//