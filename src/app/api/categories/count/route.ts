import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    
    // console.log("Hello I am server get categories count method");
    
    const posts = await prisma.category.findMany(
        {
            select:{
                id:true
            }
        }
    ).catch((exception)=>{
        // console.log("Server Error:", exception);
        return "Server Error!";
    });
    return NextResponse.json(posts);
}
