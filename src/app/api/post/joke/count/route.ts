import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    
    // console.log("Hello I am server get post for home method");
    
    const posts = await prisma.post.findMany(
        {
            select:{
                id:true
            },
            where:{
                categories:{
                    some:{
                        category:{
                            name:{
                                equals:'joke',
                                mode:'insensitive',
                            },
                        },
                    },
                },
            }
        }
    ).catch((exception)=>{
        // console.log("Server Error:", exception);
        return "Server Error!";
    });
    return NextResponse.json(posts);
}

