
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
    // console.log("Hello I am server get site method");
    const site = await prisma.site.findMany({
        orderBy:{
            id:'desc'
        },
        take:1
    }).catch((exception)=>{
        console.log("Server Error:", exception);
        notFound();
    })
    return NextResponse.json(site)
}
// 
// export const dynamicParams = true // true | false,
export const revalidate = 10;
// 