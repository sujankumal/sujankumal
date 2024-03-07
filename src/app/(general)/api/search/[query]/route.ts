import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest, {params}: {params: { query: string}}){
    
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
                                search:params.query,
                            },},
                        {
                            description:{
                                search:params.query,
                            },
                        },
                        {
                            content:{
                                some:{
                                    content:{
                                        search:params.query,
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