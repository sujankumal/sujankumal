
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
      
    const site = await prisma.site.findFirst({
        orderBy:{
            id:'desc'
        },
        select:{
            privacy_policy:true
        }
    }).catch((exception: 
 unknown)=>{
        console.log("Server Error:", exception);
        notFound();
    });
    return NextResponse.json(site);
}

// 
// export const dynamicParams = true // true | false,
export const revalidate = 10;
// 