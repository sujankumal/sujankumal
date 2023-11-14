
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/prisma";

export async function GET(request: NextRequest){
    console.log("Hello I am server get site method");
    const site = await prisma.site.findMany({
        orderBy:{
            id:'desc'
        },
        take:1
    })
    return NextResponse.json(site)
}