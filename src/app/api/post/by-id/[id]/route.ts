import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest, {params}: {params: { id: string}}){
    console.log("Hello I am server get post by-id method", typeof(params.id),params.id);
    const id = Number.parseInt(params.id);
    const site = await prisma.post.findUnique(
        {
            where:{
                id:id,
            },
            include:{
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
                content:true,
            }
        }
    ).catch((exception)=>{
        console.log("Server Error:", exception);
        return "Server Error!";
    });
    return NextResponse.json(site);
}

