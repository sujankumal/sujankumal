import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../prisma/prisma";
import { fetchJokeCountIdArray } from "@/services/data_access";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest, {params}: {params: { id: string}}){
    // console.log("Hello I am server get post by-id method", typeof(params.id),params.id);
    const id = Number.parseInt(params.id);
    // console.log("Hello I am server get post by-id method", id);
    
    const joke = await prisma.post.findUnique(
        {
            where:{
                id:id,
            },
            include:{
                categories:{
                    include:{
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
    ).catch((exception)=>{
        console.log("Server Error:", exception);
        notFound();
    });
        
    return NextResponse.json(joke);
}



export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const possibleValues = await fetchJokeCountIdArray().then((data)=>{
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