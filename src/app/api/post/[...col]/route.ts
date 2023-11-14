import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest, {params}: {params: { col: Array<String>}}){
    console.log("Hello I am server get post method", typeof(params.col),params.col);
    const site = await prisma.post.findMany(
        {
            select:Object.fromEntries(params.col.map((col)=>[col, true])),
        }
    ).catch((exception)=>{
        console.log("Server Error:", exception);
        return "Server Error!";
    });
    return NextResponse.json(site);
}

