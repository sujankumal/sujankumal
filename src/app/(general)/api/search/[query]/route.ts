import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest, context: {params: Promise<{ query: string}>}){
    
    try {
        const searched_data = await prisma.post.findMany(
            {   
                select:{
                    id:true,
                    title:true,
                },
                where:{
                    OR:[
                        {
                            title:{
                                search:(await context.params).query,
                            },},
                        {
                            description:{
                                search:(await context.params).query,
                            },
                        },
                        {
                            content:{
                                some:{
                                    content:{
                                        search:(await context.params).query,
                                    }
                                },
                            },
                        },
                    ],
                },
            }
        );
        return NextResponse.json(searched_data);    
    } catch (error) {
        console.log(error);
        notFound();
    }
}



export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number