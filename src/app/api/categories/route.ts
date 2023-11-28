
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/prisma";

export async function GET(request: NextRequest){
    // console.log("Hello I am server get site method");
    const site = await prisma.category.findMany({
        orderBy:{
            name:'asc'
        },
    })
    return NextResponse.json(site)
}
// 
// export const dynamicParams = true // true | false,
// export const revalidate = 10
// 