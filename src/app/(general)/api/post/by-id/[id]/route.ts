import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../prisma/prisma";
import { fetchPostCountIdArray } from "@/services/data_access";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest, context: {params: Promise<{ id: string}>}){
    const id = Number.parseInt((await context.params).id);
    try {
        const site = await prisma.post.findUnique(
            {
                where:{
                    id:id,
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
            console.log(error);
            notFound();
    }
}



export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const possibleValues = await fetchPostCountIdArray().then((data)=>{
        // console.log("Array of post ids: ", data);
        return data.map((item)=>{
            return item.id;
        });
    }); // Adjust based on your data
    // console.log(possibleValues);

    // Generate an array of objects with the correct structure for static generation
    const paths = possibleValues.map((value) => ({
      id: value.toString(),
    }));
    // console.log("Paths ", paths);
    return paths;
  }