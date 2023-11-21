import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";
import { fetchCategoryCountIdArray } from "@/services/data_access";

export async function GET(request: NextRequest, {params}: {params: { id: string}}){
    // console.log("Hello I am server get post by-id method", typeof(params.id),params.id);
    const id = Number.parseInt(params.id);
    const site = await prisma.category.findUnique(
        {
            where:{
                id:id,
            },
        }
    ).catch((exception)=>{
        // console.log("Server Error:", exception);
        return "Server Error!";
    });
    return NextResponse.json(site);
}



export const dynamicParams = true // true | false,
export const revalidate = 10
// false | 'force-cache' | 0 | number

// Implement the required generateStaticParams function
export async function generateStaticParams() {
    // Generate the possible values for the parameter
    
    const possibleValues = await fetchCategoryCountIdArray().then((data)=>{
        // console.log("Array of category ids: ", data);
        return data.map((item)=>{
            return item.id;
        });
    }); // Adjust based on your data
    // console.log(possibleValues);

    // Generate an array of objects with the correct structure for static generation
    const paths = (await possibleValues).map((value) => ({
      id: value.toString(),
    }));
    // console.log("Paths ", paths);
    return paths;
  }