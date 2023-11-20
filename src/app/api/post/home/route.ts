import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    
    // console.log("Hello I am server get post for home method");
    
    const posts = await prisma.post.findMany(
        {
            where:{
                categories:{
                    some:{
                        name:{
                            equals:'index',
                            mode:'insensitive',
                        },
                    },
                },
            },
            select:{
                id:true,
                title: true,
                description:true,
                date:true,
                published:true,
                categories:{
                    select:{
                        id:true,
                        name:true
                    }
                },
                author:{
                    select:{
                        id:true,
                        name:true,
                    }
                },
            }
        }
    ).catch((exception)=>{
        // console.log("Server Error:", exception);
        return "Server Error!";
    });
    return NextResponse.json(posts);
}

