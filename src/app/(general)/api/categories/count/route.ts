import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    try {
        const posts = await prisma.category.findMany(
            {
                select:{
                    id:true
                }
            }
        );
        return NextResponse.json(posts);    
    } catch (error) {
        throw error;
    }
    
}

// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
//