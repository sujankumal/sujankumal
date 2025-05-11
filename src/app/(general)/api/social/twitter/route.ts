import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
    // console.log("Hello I am server get post by-id method", typeof(params.id),params.id);
    const site = await prisma.social.findMany(
        {
            where:{
                name:{
                    equals:'twitter',
                    mode:'insensitive',
                },
            },
            select:{
                embed:true,
                username:true
            },
        }
    ).catch((exception: 
 unknown)=>{
        console.log("Server Error:", exception);
        notFound();
    });
    return NextResponse.json(site);
}


// 
// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
// 
// 

