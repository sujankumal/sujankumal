import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { fetchPostCountIdArray } from "@/services/data_access";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest, {params}: {params: { id: string}}){
    // console.log("Hello I am server get post by-id method", typeof(params.id),params.id);
    const id = Number.parseInt(params.id);
    const site = await prisma.post.findMany(
        {
            where:{
                categories:{
                    some:{
                        category:{
                            id:id,
                        },
                    },
                },
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
            },
            orderBy:{
                date:'desc'
            },
        }
    ).catch((exception)=>{
        console.log("Server Error:", exception);
        notFound();
    });
    return NextResponse.json(site);
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
    console.log("Paths ", paths);
    return paths;
  }