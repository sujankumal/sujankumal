import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
    
    // console.log("Hello I am server get post for home method");
    
    const posts = await prisma.post.findMany(
        {
            where:{
                categories:{
                    some:{
                        category:{    
                            name:{
                                equals:'index',
                                mode:'insensitive',
                            },
                        }
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
                        category:{
                            select:{
                                id:true,
                                name:true,
                            },
                        },
                    },
                },
                author:{
                    select:{
                        id:true,
                        name:true,
                    }
                },
            }
        }
    ).catch((exception: 
 unknown)=>{
        console.log("Server Error:", exception);
        notFound();
    });
    return NextResponse.json(posts);
}


// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
// 