import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    
    console.log("Hello I am server get post for about method");
    
    const posts = await prisma.post.findMany(
        {
            where:{
                categories:{
                    some:{
                        name:{
                            equals:'About',
                            mode:'insensitive',
                        },
                    },
                },
            },
            orderBy:{
                id:'desc'
            },
            take:1,
            select:{
                content:true,
            }
        }
    ).catch((exception)=>{
        console.log("Server Error:", exception);
        return "Server Error!";
    });
    return NextResponse.json(posts);
}

