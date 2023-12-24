
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    // console.log("Hello I am server get post method");
    const site = await prisma.post.findMany();
    return NextResponse.json(site);
}
// 
// export const dynamicParams = true // true | false,
export const revalidate = 10;
// 