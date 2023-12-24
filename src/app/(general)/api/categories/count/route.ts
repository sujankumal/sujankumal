import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { notFound } from "next/navigation";

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
        console.log(error);
        notFound();
    }
    
}

// 
// export const dynamicParams = true // true | false,
export const revalidate = 10;
// 