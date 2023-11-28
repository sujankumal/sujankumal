import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
    
    // console.log("Hello I am server get post for archives method");
    
    try{
        const posts = await prisma.post.findMany({
            distinct:['year','month'],
            select:{
                date:true,
                month:true,
                year:true,
            },
            orderBy:[{
                    year:'asc',
                },
                {
                    month:'asc',
            },
            ]
        });
        return NextResponse.json(posts);
    }catch(exception){
        console.log("Server Error:", exception);
        notFound();
    }
}


// 
// export const dynamicParams = true // true | false,
// export const revalidate = 10
// 