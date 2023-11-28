import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
    
    // console.log("Hello I am server get post for home method");
    
    const posts = await prisma.post.findMany(
        {
            select:{
                id: true,
                title: true,
            },
            orderBy:{
                date:'desc',
            }
        }
    ).catch((exception)=>{
        console.log("Server Error:", exception);
        notFound();
    });
    return NextResponse.json(posts);
}

