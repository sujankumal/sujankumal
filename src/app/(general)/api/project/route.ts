import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    // console.log("Hello I am server get site method");
    const site = await prisma.project.findMany({
        orderBy:{
            title:'asc'
        },
    }).catch((exception: unknown) => {
        throw exception;
    });
    return NextResponse.json(site)
}
// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
//