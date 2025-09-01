import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    
    const categories = await prisma.category.findMany(
        {
            orderBy:{
                name:'asc'
            },
            select:{
                id: true,
                name: true,
            }
        }
    ).catch((error: any) => {
        throw error;
    });
    return NextResponse.json(categories);
}


// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
//