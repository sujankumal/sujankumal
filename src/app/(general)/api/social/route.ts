
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
    // console.log("Hello I am server get social method");
    const social = await prisma.social.findMany().catch((exception: 
 unknown)=>{
        console.log("Server Error:", exception);
        notFound();
    });
    return NextResponse.json(social);
}
// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
// 