import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";

export async function GET(request: NextRequest){
    try {
        const posts = await prisma.post.findMany(
            {
                select:{
                    id: true,
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
        );
        return NextResponse.json(posts);
    } catch (error: any) {
        throw error;
    }
}


// 
// export const dynamicParams = true // true | false,
export const revalidate = 86400;
//