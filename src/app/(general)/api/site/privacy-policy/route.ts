import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest){
      
    const site = await prisma.site.findFirst({
        orderBy:{
            id:'desc'
        },
        select:{
            privacy_policy:true
        }
    }).catch((exception: unknown) => {
        throw exception;
    });
    return NextResponse.json(site);
}

// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
//