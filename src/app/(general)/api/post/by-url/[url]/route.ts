import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../prisma/prisma";
import { fetchPostUrlArray } from "@/services/data_access";

export async function GET(request: NextRequest, context: {params: Promise<{ url: string}>}){
    const url = String((await context.params).url);
    try {
        const site = await prisma.post.findFirst(
            {
                where:{
                    url:url,
                },
                include:{
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
                    content:true,
                }
            }
        );
        return NextResponse.json(site);
    } catch (error) {
        throw error;
    }
}



export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const possibleValues = await fetchPostUrlArray().then((data)=>{
        // console.log("Array of post ids: ", data);
        return data.map((item)=>{
            return item.url;
        });
    }); // Adjust based on your data
    // console.log(possibleValues);

    // Generate an array of objects with the correct structure for static generation
    const paths = possibleValues.map((url) => ({
      url: url.toString(),
    }));
    // console.log("Paths ", paths);
    return paths;
  }