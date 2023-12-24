import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../prisma/prisma";
import { fetchPostCountIdArray } from "@/services/data_access";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest, {params}: {params: { id: string}}){
    // console.log("Hello I am server get post by-id method", typeof(params.id),params.id);
    const id = Number.parseInt(params.id);
    const site = await prisma.post.findUnique(
        {
            where:{
                id:id,
            },
            select:{
                id:true,
                title:true,
            }
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

export async function generateStaticParams(){
    // console.log("Hello I am server get post ...col method generateStaticParams");
    const possibleValues = await fetchPostCountIdArray().then((data)=>{
        // console.log("Array of post ids: ", data);
        return data.map((item)=>{
            return {id: item.id.toString()};
        });
    }); // Adjust based on your data

    // console.log(possibleValues);
    return possibleValues;
}

