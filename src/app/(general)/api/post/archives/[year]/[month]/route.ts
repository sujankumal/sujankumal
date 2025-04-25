import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../../prisma/prisma";
import { fetchPostCountYearMonthArray } from "@/services/data_access";

export async function GET(request: NextRequest, context: {params: Promise<{ year: string, month:string}>}){    
    // console.log("Hello I am server get post for archives method");
    const year = Number.parseInt((await context.params).year);
    const month = Number.parseInt((await context.params).month);
    try{
        const posts = await prisma.post.findMany({
                where:{
                    AND:{
                        year:year,
                        month:month
                    }
                },
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
            });
        return NextResponse.json(posts);
    }catch(exception: unknown){
        return NextResponse.json([]);
    }
}




export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const year_month = await fetchPostCountYearMonthArray();

    // Generate an array of objects with the correct structure for static generation
    const paths = year_month.map((value) => ({
      year: value.year.toString(),
      month: value.month.toString(),
    }));
    // console.log("Paths ", paths);
    return paths;
  }