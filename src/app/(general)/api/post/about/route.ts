import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest){
    try {
        const posts = await prisma.post.findMany(
            {
                where:{
                    categories:{
                        some:{
                            category:{
                                name:{
                                    equals:'about',
                                    mode:'insensitive',
                                }
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
        );
        return NextResponse.json(posts);
    } catch (error) {
        throw error;
    }
}


// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
//