import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../prisma/prisma";

export async function GET(request: NextRequest, {params}: {params: { year: string, month:string}}){    
    // console.log("Hello I am server get post for archives method");
    const year = Number.parseInt(params.year);
    const month = Number.parseInt(params.month);
    try{
        const posts = await prisma.post.findMany({
                where:{
                    AND:{
                        year:year,
                        month:month
                    }
                }            
            });
        return NextResponse.json(posts);
    }catch(exception){
        return NextResponse.json([]);
    }
}

