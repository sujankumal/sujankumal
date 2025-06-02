import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../../prisma/prisma";
import { fetchPostCountIdArray } from "@/services/data_access";

export async function GET(request: NextRequest, context: {params: Promise<{ id: string}>}){
    const id = Number.parseInt((await context.params).id);
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
    ).catch((exception: unknown) => {
        throw exception;
    });
    return NextResponse.json(site);
}

export const dynamicParams = true // true | false,

export const revalidate = 10
// false | 'force-cache' | 0 | number

export async function generateStaticParams(){
    const possibleValues = await fetchPostCountIdArray().then((data)=>{
        return data.map((item)=>{
            return {id: item.id.toString()};
        });
    }); // Adjust based on your data

    return possibleValues;
}

